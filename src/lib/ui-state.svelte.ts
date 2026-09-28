// UI 표시 상태만 담는다. 노트 데이터는 상태가 아니라 mock/data.ts의 상수다.

export type SaveStatus = 'saved' | 'saving' | 'unsaved'
export type EditorTab = 'edit' | 'preview'

type Forced = {
  searchEmpty: boolean
  save: SaveStatus
  folderEmpty: boolean
}

// 검색 결과 없음 상태에서 입력창에 채워 둘 예시 검색어
export const FORCED_SEARCH_QUERY = '회의록 2019'

// 기능 없이 상태 변형을 보여주기 위한 개발용 URL 쿼리 (로드 시 한 번만 읽음).
// 기능 단계에서 이 함수와 forced 필드만 제거하면 된다.
function readForced(): Forced {
  const params = new URLSearchParams(window.location.search)
  const save = params.get('save')
  return {
    searchEmpty: params.get('search') === 'empty',
    save: save === 'saving' || save === 'unsaved' ? save : 'saved',
    folderEmpty: params.get('folder') === 'empty',
  }
}

export const forced: Readonly<Forced> = readForced()

export const ui = $state({
  selectedNoteId: null as string | null,
  sidebarOpen: false,
  editorTab: 'edit' as EditorTab,
  deleteDialogOpen: false,
})
