// 노트 데이터 상태. 원문(source)이 유일한 원본이고 나머지는 원문에서 파생한다.
// 부팅 때 저장소에서 불러온 노트로 initNotes()가 채우고, 편집은 자동 저장 조율자를 거쳐 저장소에 기록된다.

import { SvelteMap } from 'svelte/reactivity'
import { folderById, removeFolderFromMemory, removeFolderRecord } from './folders.svelte'
import { extractSearchText, extractTitleAndSnippet, parse, renderHtml } from './markdown/render'
import { AutosaveController, type SavePhase } from './persistence/autosave.svelte'
import { SCHEMA_VERSION, type NoteRecord, type NoteStore } from './persistence/store'
import { fold } from './search'
import { normalizeTagInput, tagKey } from './tags'

export class NoteDoc {
  readonly id: string
  // 저장본의 값 그대로다. 없는 폴더를 가리킬 수 있으므로 화면은 effectiveFolderId를 쓴다 (design.md D3)
  folderId = $state('')
  // 태그 이름, 붙인 순서. 배열을 통째로 바꿔 넣는다 (design.md D1)
  tags = $state<string[]>([])

  source = $state('')
  updatedAt = $state('')
  // 기록 전 새 노트. 공백이 아닌 글자가 처음 들어오면 false가 되고 다시 true가 되지 않는다 (design.md D2)
  draft = $state(false)

  // 인스턴스별로 지연 계산·메모이즈되므로 한 노트를 고쳐도 다른 노트는 다시 파싱하지 않는다
  #tokens = $derived(parse(this.source))
  #titleAndSnippet = $derived(extractTitleAndSnippet(this.#tokens))
  html = $derived(renderHtml(this.#tokens))
  title = $derived(this.#titleAndSnippet.title)
  snippet = $derived(this.#titleAndSnippet.snippet)
  // 검색 대상 텍스트와 그 비교용 문자열. 검색할 때 처음 계산한다 (add-note-search design.md D1, D2)
  searchText = $derived(extractSearchText(this.#tokens))
  searchKey = $derived(fold([this.searchText.title, ...this.searchText.body].join('\n')))
  // '' 이면 "폴더 없음"
  effectiveFolderId = $derived(folderById.has(this.folderId) ? this.folderId : '')

  constructor(record: NoteRecord, draft = false) {
    this.id = record.id
    this.folderId = record.folderId
    this.tags = [...record.tags]
    this.source = record.source
    this.updatedAt = record.updatedAt
    this.draft = draft
  }

  toRecordFormat(): NoteRecord {
    return {
      schema: SCHEMA_VERSION,
      id: this.id,
      folderId: this.folderId,
      tags: [...this.tags],
      source: this.source,
      updatedAt: this.updatedAt,
    }
  }
}

// 두 컬렉션은 addNote/removeNoteFromMemory로만 함께 고친다
export const notes: NoteDoc[] = $state([])
export const noteById = new SvelteMap<string, NoteDoc>()
let store: NoteStore | undefined
let autosave: AutosaveController | undefined

// 화면을 마운트하기 전에 한 번 부른다
export function initNotes(records: NoteRecord[], noteStore: NoteStore) {
  for (const record of records) addNote(new NoteDoc(record))
  store = noteStore
  autosave = new AutosaveController(noteStore, (id) => noteById.get(id)?.toRecordFormat())
}

function addNote(note: NoteDoc) {
  notes.push(note)
  noteById.set(note.id, note)
}

function removeNoteFromMemory(id: string) {
  const index = notes.findIndex((note) => note.id === id)
  if (index !== -1) notes.splice(index, 1)
  noteById.delete(id)
}

// 보안 컨텍스트가 아니면 randomUUID가 없다. 한 브라우저 안에서만 쓰는 id라 대체값으로 충분하다
function newNoteId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// 기록 전 새 노트를 만든다. 폴더와 태그는 만든 범위에서 온다('' 이면 폴더 없음)
export function createNote(folderId: string, tags: string[] = []): string {
  const note = new NoteDoc(
    {
      schema: SCHEMA_VERSION,
      id: newNoteId(),
      folderId,
      tags,
      source: '',
      updatedAt: new Date().toISOString(),
    },
    true,
  )
  addNote(note)
  return note.id
}

// 원문을 고친 직후 부른다. 수정 시각은 저장 시점이 아니라 입력 시점이다
export function markEdited(note: NoteDoc) {
  note.updatedAt = new Date().toISOString()
  if (note.draft) {
    if (note.source.trim() === '') return
    note.draft = false
  }
  autosave?.schedule(note.id)
}

// 선택을 벗어난 기록 전 새 노트를 치운다. 저장소에 쓴 적이 없어 메모리에서만 지운다
export function discardIfDraft(id: string): boolean {
  if (!noteById.get(id)?.draft) return false
  removeNoteFromMemory(id)
  return true
}

// 대기 저장을 먼저 끊고 지워야 늦게 끝난 쓰기가 레코드를 되살리지 않는다 (design.md D4).
// 실패하면 노트를 그대로 두고 throw한다
export async function deleteNote(id: string) {
  if (discardIfDraft(id)) return
  if (!store || !autosave) return
  const hadPending = autosave.statusOf(id) !== 'saved'
  await autosave.cancel(id)
  try {
    await store.remove(id)
  } catch (error) {
    if (hadPending) autosave.schedule(id)
    throw error
  }
  removeNoteFromMemory(id)
}

// 노트의 폴더를 바꾸고 바로 저장한다. 내용을 고친 게 아니라서 수정 시각은 그대로 둔다 (design.md D4)
export function moveNote(note: NoteDoc, folderId: string) {
  if (note.effectiveFolderId === folderId) return
  note.folderId = folderId
  saveMetadataNow(note)
}

// 폴더·태그처럼 원문이 아닌 값을 바꾼 뒤 부른다. 기록 전 새 노트는 기록하지 않는다
function saveMetadataNow(note: NoteDoc) {
  if (note.draft) return
  autosave?.schedule(note.id)
  autosave?.flush(note.id)
}

const collator = new Intl.Collator('ko')

// 태그 키 -> 철자. notes 순서로 훑어 키가 처음 나온 철자를 쓴다. 기록 전 새 노트도 포함한다 (design.md D2)
const usedTags = $derived.by(() => {
  const spellings = new Map<string, string>()
  for (const note of notes) {
    for (const tag of note.tags) {
      const key = tagKey(tag)
      if (!spellings.has(key)) spellings.set(key, tag)
    }
  }
  return spellings
})

// 다른 노트가 쓰는 철자가 있으면 그 철자
export function tagSpelling(name: string): string {
  return usedTags.get(tagKey(name)) ?? name
}

// 이 노트에는 없는 사용 중인 태그, 가나다순
export function tagSuggestions(note: NoteDoc): string[] {
  const own = new Set(note.tags.map(tagKey))
  return [...usedTags.values()].filter((tag) => !own.has(tagKey(tag))).sort(collator.compare)
}

// 빈 이름과 이미 붙은 태그는 조용히 무시한다. 수정 시각은 그대로 둔다 (design.md D3)
export function addTag(note: NoteDoc, raw: string) {
  const name = normalizeTagInput(raw)
  if (name === '') return
  const key = tagKey(name)
  if (note.tags.some((tag) => tagKey(tag) === key)) return
  note.tags = [...note.tags, tagSpelling(name)]
  saveMetadataNow(note)
}

export function removeTag(note: NoteDoc, name: string) {
  const key = tagKey(name)
  const remaining = note.tags.filter((tag) => tagKey(tag) !== key)
  if (remaining.length === note.tags.length) return
  note.tags = remaining
  saveMetadataNow(note)
}

// 폴더 id -> 폴더 삭제 중 저장에 실패한 노트 id
const unsavedMoves = new Map<string, Set<string>>()

// 안의 노트를 모두 폴더 없음으로 옮겨 저장한 뒤 폴더를 지운다. 노트 저장이 하나라도 실패하면 폴더를 남기고 throw한다.
// 이미 옮긴 노트는 되돌리지 않는다 (design.md D5)
export async function deleteFolder(id: string) {
  // 지난 시도에서 메모리로는 옮겼지만 저장하지 못한 노트도 다시 저장한다
  const retry = unsavedMoves.get(id) ?? new Set<string>()
  const targets = notes.filter((note) => note.folderId === id || retry.has(note.id))
  for (const note of targets) note.folderId = ''
  const saving = targets.filter((note) => !note.draft)
  const results = await Promise.all(saving.map((note) => autosave?.saveNow(note.id) ?? Promise.resolve(false)))
  const failed = saving.filter((_, index) => !results[index]).map((note) => note.id)
  if (failed.length > 0) {
    unsavedMoves.set(id, new Set(failed))
    throw new Error('moving notes out of the folder failed')
  }
  unsavedMoves.delete(id)
  await removeFolderRecord(id)
  removeFolderFromMemory(id)
}


export function saveStatusOf(id: string): SavePhase {
  return autosave?.statusOf(id) ?? 'saved'
}

// id가 없으면 대기 중인 모든 노트를 바로 저장한다
export function flushNotes(id?: string) {
  autosave?.flush(id)
}
