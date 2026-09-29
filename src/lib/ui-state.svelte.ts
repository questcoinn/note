// UI 표시 상태만 담는다. 노트 데이터 상태는 notes.svelte.ts에 있다.

import { folderById } from './folders.svelte'
import { createNote, discardIfDraft, flushNotes, noteById, notes, tagSpelling, type NoteDoc } from './notes.svelte'
import { tagKey } from './tags'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'
export type EditorTab = 'edit' | 'preview'
// 가운데 노트 목록이 보여주는 범위. 사이드바나 노트 카드의 태그 칩에서 고른다.
// 태그 범위는 key로 비교하고, name은 제목에 쓰는 철자다. 태그가 모든 노트에서 사라져도 범위는 남는다 (design.md D4)
export type Scope =
  | { kind: 'all' }
  | { kind: 'unfiled' }
  | { kind: 'folder'; id: string }
  | { kind: 'tag'; key: string; name: string }

type Forced = {
  searchEmpty: boolean
}

// 검색 결과 없음 상태에서 입력창에 채워 둘 예시 검색어
export const FORCED_SEARCH_QUERY = '회의록 2019'

// 기능 없이 상태 변형을 보여주기 위한 개발용 URL 쿼리 (로드 시 한 번만 읽음).
// 검색 기능 단계에서 이 함수와 forced 필드를 제거한다.
function readForced(): Forced {
  const params = new URLSearchParams(window.location.search)
  return {
    searchEmpty: params.get('search') === 'empty',
  }
}

export const forced: Readonly<Forced> = readForced()

export const ui = $state({
  // 새로고침하면 전체 노트로 시작한다
  scope: { kind: 'all' } as Scope,
  selectedNoteId: null as string | null,
  // 선택된 노트의 목록 정렬 키. 선택한 순간의 수정 시각으로 고정해 편집하는 동안 카드가 움직이지 않게 한다
  pinnedSortKey: null as string | null,
  sidebarOpen: false,
  editorTab: 'edit' as EditorTab,
  deleteDialogOpen: false,
  // 마지막 삭제 시도가 실패했는지. 다이얼로그를 열 때마다 초기화한다
  deleteError: false,
  // 늘어날 때마다 에디터가 원문 영역에 포커스한다
  focusSourceRequest: 0,
})

// 선택 변경은 모두 여기를 거친다. 떠나는 노트의 편집을 바로 저장하고(기록 전 새 노트면 치우고) 정렬 고정을 옮긴다
export function selectNote(id: string | null) {
  if (ui.selectedNoteId === id) return
  const leaving = ui.selectedNoteId
  if (leaving !== null && !discardIfDraft(leaving)) flushNotes(leaving)
  ui.selectedNoteId = id
  ui.pinnedSortKey = id === null ? null : (noteById.get(id)?.updatedAt ?? null)
}

export function inScope(note: NoteDoc, scope: Scope): boolean {
  if (scope.kind === 'all') return true
  if (scope.kind === 'unfiled') return note.effectiveFolderId === ''
  if (scope.kind === 'tag') return note.tags.some((tag) => tagKey(tag) === scope.key)
  return note.effectiveFolderId === scope.id
}

export function isSameScope(a: Scope, b: Scope): boolean {
  if (a.kind === 'folder') return b.kind === 'folder' && a.id === b.id
  if (a.kind === 'tag') return b.kind === 'tag' && a.key === b.key
  return a.kind === b.kind
}

export function tagScope(name: string): Scope {
  return { kind: 'tag', key: tagKey(name), name }
}

export function scopeName(scope: Scope): string {
  if (scope.kind === 'all') return '전체 노트'
  if (scope.kind === 'unfiled') return '폴더 없음'
  if (scope.kind === 'tag') return `#${scope.name}`
  return folderById.get(scope.id)?.name ?? ''
}

export function scopedNotes(): NoteDoc[] {
  return notes.filter((note) => inScope(note, ui.scope))
}

// 목록 빈 상태(노트 없음, 빈 폴더)가 "새 노트" 버튼을 보여주는지. 그때 에디터 빈 상태는 버튼을 뺀다
export function listEmptyShowsNewNote(): boolean {
  // 태그 범위의 빈 상태는 노트가 하나도 없어도 버튼이 없다 (design.md D4)
  if (forced.searchEmpty || ui.scope.kind === 'tag' || scopedNotes().length > 0) return false
  return notes.length === 0 || ui.scope.kind === 'folder'
}

// 범위만 바꾼다. 열린 노트는 새 범위에 없어도 닫지 않으므로 selectNote()를 부르지 않는다 (design.md D2)
export function selectScope(scope: Scope) {
  ui.scope = scope
}

// 폴더 범위에서 만든 새 노트는 그 폴더에 들어간다. 태그 범위는 폴더가 아니다
function scopeFolderId(): string {
  return ui.scope.kind === 'folder' ? ui.scope.id : ''
}

// 태그 범위에서 만든 새 노트에는 그 태그가 붙는다. 다른 노트가 쓰는 철자를 따른다
function scopeTags(): string[] {
  return ui.scope.kind === 'tag' ? [tagSpelling(ui.scope.name)] : []
}

// 모든 "새 노트" 버튼이 부른다. 이미 기록 전 새 노트를 보고 있으면 더 만들지 않고 포커스만 옮긴다 (design.md D6)
export function startNewNote() {
  const current = ui.selectedNoteId === null ? undefined : noteById.get(ui.selectedNoteId)
  if (!current?.draft) selectNote(createNote(scopeFolderId(), scopeTags()))
  ui.editorTab = 'edit'
  // 오버레이의 close()와 달리 토글 버튼으로 포커스를 돌려주지 않는다. 포커스는 원문으로 간다
  ui.sidebarOpen = false
  ui.focusSourceRequest++
}
