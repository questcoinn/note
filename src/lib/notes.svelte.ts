// 노트 데이터 상태. 원문(source)이 유일한 원본이고 나머지는 원문에서 파생한다.
// 부팅 때 저장소에서 불러온 노트로 initNotes()가 채우고, 편집은 자동 저장 조율자를 거쳐 저장소에 기록된다.

import { extractTitleAndSnippet, parse, renderHtml } from './markdown/render'
import type { NoteSeed } from './mock/data'
import { AutosaveController, type SavePhase } from './persistence/autosave.svelte'
import { SCHEMA_VERSION, type NoteRecord, type NoteStore } from './persistence/store'

export class NoteDoc {
  readonly id: string
  readonly folderId: string
  readonly tagIds: string[]

  source = $state('')
  updatedAt = $state('')

  // 인스턴스별로 지연 계산·메모이즈되므로 한 노트를 고쳐도 다른 노트는 다시 파싱하지 않는다
  #tokens = $derived(parse(this.source))
  #titleAndSnippet = $derived(extractTitleAndSnippet(this.#tokens))
  html = $derived(renderHtml(this.#tokens))
  title = $derived(this.#titleAndSnippet.title)
  snippet = $derived(this.#titleAndSnippet.snippet)

  constructor(record: NoteRecord) {
    this.id = record.id
    this.folderId = record.folderId
    this.tagIds = record.tagIds
    this.source = record.source
    this.updatedAt = record.updatedAt
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

// 이번 변경에서는 노트 추가·삭제가 없어 initNotes() 뒤로는 배열 구성이 바뀌지 않는다
export const notes: NoteDoc[] = []
export const noteById = new Map<string, NoteDoc>()
let autosave: AutosaveController | undefined

// 화면을 마운트하기 전에 한 번 부른다
export function initNotes(records: NoteRecord[], store: NoteStore) {
  for (const record of records) {
    const note = new NoteDoc(record)
    notes.push(note)
    noteById.set(note.id, note)
  }
  autosave = new AutosaveController(store, (id) => noteById.get(id)?.toRecordFormat())
}

// 첫 실행용. 수정 시각은 now에서 각 seed의 오프셋만큼 뺀 값이다
export function seedsToRecordFormat(seeds: NoteSeed[], now: Date): NoteRecord[] {
  return seeds.map((seed) => ({
    schema: SCHEMA_VERSION,
    id: seed.id,
    folderId: seed.folderId,
    tagIds: [...seed.tagIds],
    source: seed.source,
    updatedAt: new Date(now.getTime() - seed.minutesAgo * 60_000).toISOString(),
  }))
}

// 원문을 고친 직후 부른다. 수정 시각은 저장 시점이 아니라 입력 시점이다
export function markEdited(note: NoteDoc) {
  note.updatedAt = new Date().toISOString()
  autosave?.schedule(note.id)
}

export function saveStatusOf(id: string): SavePhase {
  return autosave?.statusOf(id) ?? 'saved'
}

// id가 없으면 대기 중인 모든 노트를 바로 저장한다
export function flushNotes(id?: string) {
  autosave?.flush(id)
}
