// 노트 데이터 상태. 원문(source)이 유일한 원본이고 나머지는 원문에서 파생한다.
// 부팅 때 저장소에서 불러온 노트로 initNotes()가 채우고, 편집은 자동 저장 조율자를 거쳐 저장소에 기록된다.

import { SvelteMap } from 'svelte/reactivity'
import { extractTitleAndSnippet, parse, renderHtml } from './markdown/render'
import { AutosaveController, type SavePhase } from './persistence/autosave.svelte'
import { SCHEMA_VERSION, type NoteRecord, type NoteStore } from './persistence/store'

export class NoteDoc {
  readonly id: string
  readonly folderId: string
  readonly tagIds: string[]

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

  constructor(record: NoteRecord, draft = false) {
    this.id = record.id
    this.folderId = record.folderId
    this.tagIds = record.tagIds
    this.source = record.source
    this.updatedAt = record.updatedAt
    this.draft = draft
  }

  toRecordFormat(): NoteRecord {
    return {
      schema: SCHEMA_VERSION,
      id: this.id,
      folderId: this.folderId,
      tagIds: [...this.tagIds],
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

// 기록 전 새 노트를 만든다. 폴더·태그는 없다
export function createNote(): string {
  const note = new NoteDoc(
    {
      schema: SCHEMA_VERSION,
      id: newNoteId(),
      folderId: '',
      tagIds: [],
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

export function saveStatusOf(id: string): SavePhase {
  return autosave?.statusOf(id) ?? 'saved'
}

// id가 없으면 대기 중인 모든 노트를 바로 저장한다
export function flushNotes(id?: string) {
  autosave?.flush(id)
}
