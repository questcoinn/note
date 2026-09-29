## Context

- 동기와 범위는 proposal.md를 참고한다. 관찰 가능한 동작은 `specs/note-ui-skeleton/spec.md`, `specs/note-persistence/spec.md`, `specs/markdown-preview/spec.md`에 있다.
- `src/lib/notes.svelte.ts`의 `notes` 배열과 `noteById` Map은 일반 컬렉션이다. "initNotes() 뒤로는 배열 구성이 바뀌지 않는다"는 전제로 짜여 있다. 그래서 `NoteList`의 `sortedNotes`(`$derived`)와 사이드바 `notes.length`는 추가나 삭제에 반응하지 않는다.
- 저장 계층에는 `NoteStore.remove(id)`와 `AutosaveController.cancel(id)`가 이미 있지만 부르는 곳이 없다. `cancel`은 진행 중인 쓰기를 기다리지 않는다. 지금 localStorage 구현은 `put`을 호출하는 순간 동기로 쓰므로 문제가 없지만, 비동기 저장소에서는 늦게 끝난 쓰기가 지운 레코드를 되살릴 수 있다.
- 선택 변경은 모두 `ui-state.svelte.ts`의 `selectNote()`를 거친다. 떠나는 노트의 flush와 정렬 고정이 여기서 일어난다.
- `ConfirmDialog`는 `<dialog>.showModal()`로 포커스 가두기와 Esc를 처리한다. 확인 버튼은 누르면 `onconfirm`만 부른다.
- 목업(`src/lib/mock/data.ts`)은 `main.ts`(첫 실행 seed), `notes.svelte.ts`(`NoteSeed` 타입), `Sidebar`(폴더·태그·`EMPTY_FOLDER_ID`), `NoteList`(`folderById`, 빈 폴더), `NoteCard`(`tagById`)가 쓴다. `NoteCard`는 모르는 태그 id를 그대로 칩으로 보여준다(`?? tagId`). 그래서 태그 목업만 지우면 예전 목업 노트에 `meeting` 같은 id가 칩으로 뜬다.

## Goals / Non-Goals

**Goals:**
- 노트 컬렉션을 반응형으로 바꿔 만들기·삭제·정리가 목록, 개수, 에디터에 바로 반영되게 한다.
- "기록 전 새 노트" 개념을 `NoteDoc` 한곳에 두어, 자동 저장·정리·삭제가 같은 기준을 보게 한다.
- 비동기 저장소로 바꿔도 삭제한 노트가 늦은 쓰기로 되살아나지 않게 한다.

**Non-Goals:**
- 저장 형식 변경이나 마이그레이션. `NoteRecord` v1을 그대로 쓴다.
- 여러 탭 사이 삭제 동기화. 다른 탭에 열려 있는 노트는 그 탭이 저장하면 다시 생긴다(마지막 쓰기가 남는다는 기존 방침과 같다).
- 삭제 중 로딩 표시. 로컬 동작이라 즉시 끝나며, DESIGN.md도 loading을 not-applicable로 둔다.

## Decisions

### D1. 반응형 컬렉션

- `notes`는 `$state<NoteDoc[]>([])`, `noteById`는 `SvelteMap`으로 바꾼다. 둘은 모듈 안의 `addNote`, `removeNoteFromMemory`로만 함께 고치고, 바깥에는 `createNote`, `discardIfDraft`, `deleteNote`만 내보낸다.
- `NoteDoc`은 클래스 인스턴스라 `$state` 배열에 넣어도 프록시되지 않는다. 필드 반응성은 지금처럼 클래스의 `$state` 필드가 맡는다.
- 대안: `noteById`를 `notes`에서 `$derived`로 만들기. 편집할 때마다 Map을 다시 만들 이유가 없고 조회가 잦아서 기각했다.

### D2. 기록 전 새 노트는 `NoteDoc.draft` 플래그

```
 createNote()                     markEdited(note)
   draft = true                     |
   source = ''                      +-- draft && source.trim() === ''  --> updatedAt만 갱신, 저장 예약 안 함
   updatedAt = now                  +-- draft && 공백 아닌 글자        --> draft = false, schedule(id)
   folderId = '', tagIds = []       +-- !draft                        --> 지금처럼 schedule(id)
```

- `draft`는 `$state`이고 true에서 false로만 바뀐다. 이것이 "한 번이라도 썼으면 비워도 정리하지 않는다"는 규칙이다.
- draft 노트는 `AutosaveController`에 항목이 없으므로 `statusOf`가 `'saved'`를 돌려준다. 저장 상태 표시에 따로 분기가 필요 없다.
- 탭 닫기나 새로고침 때 할 일이 없다. 저장소에 쓴 적이 없어 부팅하면 자연히 사라진다. `pagehide` 정리 로직을 만들지 않는다.
- 대안: 만들 때 바로 기록하고, 떠날 때 비어 있으면 `remove`. 탭을 닫는 경우엔 정리 기회가 없어(`pagehide`의 비동기 작업은 끝난다는 보장이 없다) 부팅 시 빈 레코드를 청소해야 한다. 그러면 사용자가 일부러 비워 둔 노트까지 지울 위험이 생겨서 기각했다.

### D3. 정리는 `selectNote()`에서

- `selectNote(id)`는 떠나는 노트가 draft이면 flush 대신 메모리에서만 지운다(`discardIfDraft`). 다른 노트 열기, 뒤로 가기(`selectNote(null)`), 삭제 후 해제가 모두 이 한 경로를 지난다.
- `createNote()`는 선택된 노트가 draft이면 새로 만들지 않고 포커스 요청만 보낸다(D6). 그래서 draft에서 draft로 가는 전이는 없다.

### D4. 삭제 순서와 늦은 쓰기 차단

```
 deleteNote(id):
   note.draft ?  --> removeNoteFromMemory(id), 끝 (저장소 안 건드림)
   hadPending = autosave.statusOf(id) !== 'saved'
   await autosave.cancel(id)      <-- 진행 중인 쓰기가 끝날 때까지 기다림, 후속 저장 없음
   try   await store.remove(id)
   catch  if (hadPending) autosave.schedule(id)   <-- 버린 대기 편집을 되살림
          throw                                     <-- 화면에 실패 전달
   removeNoteFromMemory(id)
```

- `AutosaveController.cancel`을 `Promise<void>`를 돌려주도록 바꾼다. `Entry`에 진행 중 쓰기의 promise를 보관하고, cancel은 그것을 기다린다. localStorage에서는 즉시 끝난다.
- 먼저 cancel하고 나서 remove하는 이유: remove를 먼저 하면 그 사이 끝난 쓰기(또는 예약 타이머)가 레코드를 다시 만든다.
- remove가 실패하면 저장 대기 편집이 cancel로 사라진 상태다. 그래서 삭제 전에 저장 대기·진행·실패 상태였으면 다시 예약한다. 원래 "저장됨"이었다면 저장본이 최신이라 되살릴 것이 없다.
- `NoteStore`에 저장소 인스턴스를 넘기는 곳은 지금처럼 `initNotes(records, store)` 하나다. `notes.svelte.ts`가 store 참조를 들고 `deleteNote`에서 쓴다.

### D5. 삭제 흐름의 UI 상태

- `ui`에 `deleteError: boolean`을 둔다. 다이얼로그를 열 때 false로 초기화하고, `deleteNote`가 throw하면 true로 바꾼다.
- `ConfirmDialog`에 선택 prop `error?: string`을 추가한다. 값이 있으면 설명 아래에 경고 아이콘과 문구를 danger 색으로 `role="alert"` 영역에 보여준다. 확인 버튼 레이블은 호출부가 정한다(실패 뒤에는 "다시 삭제").
- 성공하면 `ui.deleteDialogOpen = false`, `selectNote(null)`, 목록 제목(`#note-list-title`, `tabindex="-1"`)으로 포커스를 옮긴다. 좁은 화면은 선택 해제만으로 목록이 보인다(기존 레이아웃 규칙). 포커스는 `tick()` 뒤에 옮긴다.
- 문구:
  - 실패: "노트를 삭제하지 못했어요. 다시 시도해 주세요."
  - 버튼: "삭제", 실패 뒤에는 "다시 삭제"
- 대안: 다이얼로그를 닫고 에디터 상단에 알림. 저장 상태 표시와 자리가 겹치고, 사용자가 방금 누른 행동과 결과가 떨어져서 기각했다(탐색 단계에서 결정).

### D6. 새 노트 만들기와 포커스

- `createNote()`(notes.svelte.ts)는 `crypto.randomUUID()`로 id를 만든다. 보안 컨텍스트가 아니라 없으면 시각과 난수를 조합한 값으로 대신한다. `NoteDoc`을 draft로 추가하고 id를 돌려준다.
- 화면 동작은 `ui-state.svelte.ts`의 `startNewNote()`가 묶는다: 선택된 노트가 draft면 그대로 두고, 아니면 `createNote()` 후 `selectNote(id)`. 그다음 `ui.editorTab = 'edit'`, `ui.sidebarOpen = false`로 두고 `ui.focusSourceRequest`를 1 늘린다.
- `EditorPane`은 `focusSourceRequest`를 보는 `$effect`에서 원문 textarea에 포커스한다. 카운터라서 draft를 다시 선택할 때도 포커스가 간다.
- 세 곳의 "새 노트" 버튼(사이드바, 에디터 빈 상태, 목록 빈 상태)은 모두 `startNewNote`를 부른다.
- 사이드바 오버레이를 닫을 때 기존 `close()`는 포커스를 토글 버튼으로 돌려준다. 새 노트에서는 원문으로 가야 하므로 `ui.sidebarOpen = false`만 쓰고 토글 포커스 복귀는 하지 않는다.

### D7. 목업 제거

- `src/lib/mock/data.ts`를 지운다. `NoteSeed`, `seedsToRecordFormat`, `main.ts`의 첫 실행 기록과 `clock.now = Date.now()` 보정(seed 시각 맞춤용)을 지운다.
- `main.ts`의 로드는 `loadAll()`이 성공하면 `notes`, 실패하면 `[]`다. `LoadResult.hasAnyRecord`는 더 쓰지 않는다. 인터페이스에서 필드를 빼서 죽은 계약을 남기지 않는다.
- `Sidebar`: 폴더·태그 섹션, `activeFolderId`, `EMPTY_FOLDER_ID`를 지운다. "전체 노트"는 늘 active다. `nav`의 `aria-label`은 "노트 탐색"으로 바꾼다.
- `NoteList`: 빈 폴더 분기와 `folderById`를 지우고 목록 제목은 늘 "전체 노트"다. 노트 0개 분기를 추가한다. `forced.searchEmpty`가 먼저다.
- `NoteCard`: 태그 칩 목록을 지운다.
- `ui-state.svelte.ts`: `forced.folderEmpty`와 `?folder=` 읽기를 지운다.
- `TagChip.svelte`와 `SidebarNavItem`의 folder·tag 변형은 DESIGN.md 계약 컴포넌트라 코드에 남긴다. 폴더·태그 기능에서 다시 쓴다.

### D8. 노트 없음 빈 상태 문구

- 아이콘 `file-text`, 제목 "아직 노트가 없어요", 설명 "떠오른 생각을 바로 적어 두세요.", 행동 "새 노트" 1차 버튼.
- 노트가 없을 때 에디터 빈 상태에서는 "새 노트" 버튼을 뺀다. 넓은 화면에서 같은 버튼이 세 번 보이는 것을 피하기 위해서다(사용자 결정). 목록 빈 상태의 버튼은 좁은 화면(사이드바가 숨겨지고 에디터 빈 상태도 안 보임)에서 유일하게 바로 보이는 진입점이라 남긴다. 노트는 있는데 선택만 없을 때는 목록에 버튼이 없으므로 에디터 빈 상태의 버튼을 유지한다.

## Risks / Trade-offs

- [draft 노트가 선택된 채 검색 강제(`?search=empty`)로 목록이 가려짐] → 개발용 상태라 받아들인다. 에디터에는 정상으로 열린다.
- [다른 탭에서 연 노트를 이 탭에서 삭제] → 다른 탭이 그 노트를 편집하면 다시 기록된다. 여러 탭 동기화는 범위 밖이다(Non-Goals).
- [예전 목업 노트가 폴더·태그 id를 가진 채 남음] → 화면은 이 값을 무시한다. 폴더·태그 기능을 만들 때 모르는 id를 어떻게 다룰지 정한다.
- [삭제 실패 후 재시도 사이의 편집] → 다이얼로그가 모달이라 그동안 편집할 수 없다. 취소하면 D4에서 되살린 대기 저장이 정상적으로 진행된다.
- [`crypto.randomUUID` 없는 환경] → 대체 id 생성으로 막는다. 한 브라우저 안에서만 쓰는 id라 충돌 위험은 무시할 만하다.

## Migration Plan

- 저장 형식이 같아서 이관 작업이 없다. 이미 목업이 기록된 브라우저는 그 노트를 사용자 노트로 계속 보여준다.
- 되돌리면 이전 버전은 노트가 하나라도 있는 저장소에서 목업을 다시 넣지 않는다. 다만 모든 노트를 지운 브라우저에서는 목업이 다시 기록된다.

## Open Questions

- 노트 없음 빈 상태와 삭제 실패 문구의 최종 표현은 구현 뒤 화면에서 다듬을 수 있다. 스펙은 문구의 의미만 정한다.
