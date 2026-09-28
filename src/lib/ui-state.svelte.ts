// UI 표시 상태만 담는다. 노트 데이터 상태는 notes.svelte.ts에 있다.

import { flushNotes, noteById } from './notes.svelte'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'
export type EditorTab = 'edit' | 'preview'

type Forced = {
  searchEmpty: boolean
  folderEmpty: boolean
}

// 검색 결과 없음 상태에서 입력창에 채워 둘 예시 검색어
export const FORCED_SEARCH_QUERY = '회의록 2019'

// 기능 없이 상태 변형을 보여주기 위한 개발용 URL 쿼리 (로드 시 한 번만 읽음).
// 검색·폴더 기능 단계에서 이 함수와 forced 필드를 제거한다.
function readForced(): Forced {
  const params = new URLSearchParams(window.location.search)
  return {
    searchEmpty: params.get('search') === 'empty',
    folderEmpty: params.get('folder') === 'empty',
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
})

// 선택 변경은 모두 여기를 거친다. 떠나는 노트의 편집을 바로 저장하고 정렬 고정을 옮긴다
export function selectNote(id: string | null) {
  if (ui.selectedNoteId === id) return
  if (ui.selectedNoteId !== null) flushNotes(ui.selectedNoteId)
  ui.selectedNoteId = id
  ui.pinnedSortKey = id === null ? null : (noteById.get(id)?.updatedAt ?? null)
}
