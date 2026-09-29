## 1. 목업 제거

- [x] 1.1 `src/lib/mock/data.ts`를 지우고, `main.ts`에서 첫 실행 seed 기록과 `clock.now = Date.now()` 보정을, `notes.svelte.ts`에서 `NoteSeed`와 `seedsToRecordFormat`를 지운다. D7대로 `LoadResult.hasAnyRecord`를 빼고 `loadAll()` 실패 시 `[]`로 시작한다 — `rg "mock/data|noteSeeds|hasAnyRecord|seedsToRecordFormat" src` 결과 없음, `pnpm check` 통과
- [x] 1.2 `Sidebar`에서 폴더·태그 섹션과 `activeFolderId`를 지우고 `nav`의 `aria-label`을 "노트 탐색"으로 바꾼다. `NoteCard`에서 태그 칩 목록을 지운다. `ui-state.svelte.ts`에서 `forced.folderEmpty`와 `?folder=` 읽기를, `NoteList`에서 빈 폴더 분기를 지운다 — 목업이 저장된 브라우저에서 사이드바에 "새 노트"와 "전체 노트"만 보이고 카드에 태그 칩이 없는지, `?folder=empty`가 무시되는지 확인
- [x] 1.3 localStorage를 비운 브라우저에서 앱을 연다 — 저장소에 `note:v1:*` 키가 생기지 않고, 에디터 빈 상태가 보이는지 확인 (목록 빈 상태는 3.3)

## 2. 노트 데이터

- [x] 2.1 `notes.svelte.ts`의 `notes`를 `$state` 배열로, `noteById`를 `SvelteMap`으로 바꾸고, 둘을 같이 고치는 `addNote`, `removeNoteFromMemory`를 모듈 안에 둔다(D1). "배열 구성이 바뀌지 않는다" 주석을 갱신한다 — `pnpm check` 통과, 이후 3.x에서 목록·개수가 반응하는지로 확인
- [x] 2.2 `NoteDoc`에 `draft` `$state`를 추가하고, `createNote()`(D6의 id 생성, `folderId: ''`, `tagIds: []`, `updatedAt: now`)와 D2의 `markEdited` 분기를 구현한다 — 새 노트를 만들고 공백만 입력하는 동안 저장소에 레코드가 없고, 글자를 입력하면 `note:v1:<id>` 키가 생기는지 DevTools로 확인
- [x] 2.3 `AutosaveController`의 `Entry`에 진행 중 쓰기 promise를 보관하고, `cancel`이 그것을 기다린 뒤 끝나는 `Promise<void>`를 돌려주게 바꾼다(D4) — `pnpm check` 통과
- [x] 2.4 `deleteNote(id)`를 D4 순서대로 구현한다(draft는 메모리에서만 제거, cancel 후 remove, 실패 시 대기 편집 재예약 후 throw) — 입력 직후 "저장 중"일 때 삭제하고 2초 뒤 새로고침해도 노트가 돌아오지 않는지 확인

## 3. 새 노트 UI

- [x] 3.1 `ui-state.svelte.ts`의 `selectNote()`가 떠나는 노트가 draft이면 flush 대신 `discardIfDraft`로 메모리에서만 지우게 바꾼다(D3) — 새 노트를 만들고 아무것도 쓰지 않은 채 다른 카드를 누르면 "제목 없음" 카드가 사라지고 "전체 노트" 개수가 원래대로인지 확인
- [x] 3.2 `startNewNote()`와 `ui.focusSourceRequest`를 추가하고(D6), 사이드바·에디터 빈 상태의 "새 노트" 버튼에 연결한다. `EditorPane`에 `focusSourceRequest`를 보고 원문에 포커스하는 `$effect`를 둔다 — 1280px에서 사이드바 "새 노트"를 누르면 맨 위에 selected "제목 없음" 카드가 생기고 원문에 포커스가 가는지, 곧바로 다시 누르면 카드가 하나뿐인지 확인
- [x] 3.3 `NoteList`에 노트 0개 빈 상태(D8 문구, "새 노트" 버튼)를 추가한다. `forced.searchEmpty`가 우선한다 — 빈 저장소에서 목록 빈 상태가 보이고, 그 버튼으로 노트를 만들 수 있는지 확인
- [x] 3.4 좁은 화면 동작을 확인한다 — 375px에서 사이드바 오버레이의 "새 노트"를 누르면 오버레이가 닫히고 편집 탭이 선택된 상세가 원문에 포커스된 채 열리는지, 공백만 입력하고 뒤로 가기를 누르면 목록에 그 노트가 없는지 확인

## 4. 삭제 UI

- [x] 4.1 `ConfirmDialog`에 선택 prop `error`를 추가하고, 값이 있으면 설명 아래에 경고 아이콘과 문구를 danger 색으로 `role="alert"` 영역에 보여준다(D5) — `pnpm check` 통과, 4.3에서 화면 확인
- [x] 4.2 `EditorPane`의 삭제 흐름을 연결한다: 다이얼로그를 열 때 `ui.deleteError` 초기화, "삭제"에서 `deleteNote` 호출, 성공하면 닫기·`selectNote(null)`·`tick()` 뒤 `#note-list-title`(`tabindex="-1"`) 포커스, 실패하면 `deleteError = true`와 버튼 레이블 "다시 삭제" — 1280px에서 삭제하면 카드가 사라지고 에디터 빈 상태와 목록 제목 포커스가 보이며 개수가 1 줄어드는지, 375px에서는 목록으로 돌아가는지 확인
- [x] 4.3 실패 경로를 확인한다 — DevTools 콘솔에서 `localStorage.removeItem`을 임시로 예외를 던지게 바꾸고 삭제하면, 다이얼로그가 열린 채 실패 문구가 보이고 스크린 리더(VoiceOver)가 읽는지, "취소" 뒤 노트가 그대로 있는지, 원래 함수로 되돌린 뒤 "다시 삭제"가 성공하는지 확인

## 5. 검증

- [x] 5.1 `pnpm check`와 `pnpm build`가 경고 없이 통과한다
- [x] 5.2 세 델타 스펙의 시나리오를 브라우저에서 차례로 확인한다. 1280px, 900px, 375px, 320px에서 확인하고, 네트워크 요청이 없는지와 320px에서 가로 스크롤이 없는지도 본다
- [x] 5.3 키보드만으로 새 노트 만들기, 입력, 삭제, 취소가 되는지 확인한다. 모든 버튼에 포커스 링이 보이고, 다이얼로그를 닫은 뒤 포커스가 문서 맨 위로 튀지 않아야 한다
