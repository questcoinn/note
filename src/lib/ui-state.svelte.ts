// UI 표시 상태만 담는다. 노트 데이터 상태는 notes.svelte.ts에 있다.

import { createNote, discardIfDraft, flushNotes, noteById } from './notes.svelte'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'
export type EditorTab = 'edit' | 'preview'

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

// 모든 "새 노트" 버튼이 부른다. 이미 기록 전 새 노트를 보고 있으면 더 만들지 않고 포커스만 옮긴다 (design.md D6)
export function startNewNote() {
  const current = ui.selectedNoteId === null ? undefined : noteById.get(ui.selectedNoteId)
  if (!current?.draft) selectNote(createNote())
  ui.editorTab = 'edit'
  // 오버레이의 close()와 달리 토글 버튼으로 포커스를 돌려주지 않는다. 포커스는 원문으로 간다
  ui.sidebarOpen = false
  ui.focusSourceRequest++
}
