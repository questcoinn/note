// 노트 데이터 상태. 원문(source)이 유일한 원본이고 나머지는 원문에서 파생한다.
// 세션 메모리에만 있으므로 새로고침하면 목업 초기값으로 돌아간다.

import { extractTitleAndSnippet, parse, renderHtml } from './markdown/render'
import { noteSeeds, type NoteSeed } from './mock/data'

export class NoteDoc {
  readonly id: string
  readonly folderId: string
  readonly tagIds: string[]
  readonly updatedLabel: string

  source = $state('')
  // 이 세션에서 원문을 한 번이라도 고쳤는지. 영속화가 없어 되돌아가지 않는다
  dirty = $state(false)

  // 인스턴스별로 지연 계산·메모이즈되므로 한 노트를 고쳐도 다른 노트는 다시 파싱하지 않는다
  #tokens = $derived(parse(this.source))
  #titleAndSnippet = $derived(extractTitleAndSnippet(this.#tokens))
  html = $derived(renderHtml(this.#tokens))
  title = $derived(this.#titleAndSnippet.title)
  snippet = $derived(this.#titleAndSnippet.snippet)

  constructor(seed: NoteSeed) {
    this.id = seed.id
    this.folderId = seed.folderId
    this.tagIds = seed.tagIds
    this.updatedLabel = seed.updatedLabel
    this.source = seed.source
  }
}

// 이번 변경에서는 노트 추가·삭제·정렬이 없어 배열 구성은 바뀌지 않는다
export const notes: NoteDoc[] = noteSeeds.map((seed) => new NoteDoc(seed))
export const noteById = new Map(notes.map((note) => [note.id, note]))
