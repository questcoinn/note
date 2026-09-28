## 1. 저장소 계층

- [x] 1.1 `src/lib/persistence/store.ts`에 D2의 `NoteStore` 인터페이스, `NoteRecord`·`LoadResult` 타입, D3의 레코드 형식 검사 함수(`schema === 1`과 필드 타입 확인)를 작성하고, 인터페이스 주석에 D7의 `pagehide` 주의점을 남긴다 — `pnpm check` 통과
- [x] 1.2 `src/lib/persistence/local-storage-store.ts`에 `LocalStorageStore`(`loadAll`, `put`, `remove`)를 작성한다. `note:v1:` 접두사 키만 읽고, 손상되거나 형식이 맞지 않는 레코드는 건너뛰되 지우지 않으며, 예외는 reject로 바꾼다 — DevTools 콘솔에서 임시로 정상 레코드 2개와 손상 레코드 1개를 넣고 `loadAll()`이 2개와 `hasAnyRecord: true`를 돌려주고 손상 키가 남아 있는지 확인한 뒤 임시 데이터를 지운다

## 2. 자동 저장 조율자

- [x] 2.1 `src/lib/persistence/autosave.svelte.ts`에 D4의 `AutosaveController`(`schedule`, `flush`, `cancel`, `statusOf`)를 작성한다. 대기 500ms와 최대 대기 2000ms는 상수로 두고, 노트당 동시 쓰기를 하나로 제한하며, 쓰는 도중 들어온 입력은 쓰기가 끝난 뒤 다시 저장한다 — `pnpm check` 통과
- [x] 2.2 실패 경로를 확인한다: `put`이 reject하면 `failed`가 되고 다음 `schedule`에서 다시 쓴다 — 6.2의 용량 초과·재시도 시나리오로 브라우저에서 확인

## 3. 노트 데이터와 부팅

- [x] 3.1 `mock/data.ts`의 `NoteSeed`에서 `updatedLabel`을 빼고 D5의 상대 오프셋 필드를 넣는다. 기존 문구("3분 전", "1시간 전", "어제", "2일 전", "3일 전", "9월 21일", "9월 14일")를 2026-09-28 기준 오프셋으로 옮기고 파일 상단 주석을 갱신한다 — `rg updatedLabel src`로 결과 없음 확인
- [x] 3.2 `notes.svelte.ts`의 `NoteDoc`을 `NoteRecord`로 생성하도록 바꾸고 `updatedAt` `$state`를 추가하며 `dirty`를 제거한다. 모듈 로드 시 만들던 `notes`와 `noteById`를 `initNotes()`로 초기화하게 바꾸고, seed를 `NoteRecord`로 바꾸는 함수(첫 실행 시각 기준)를 둔다. 파일 상단의 "세션 메모리에만 있다" 주석을 갱신한다 — `pnpm check` 통과
- [x] 3.3 `main.ts`를 D5 흐름으로 바꾼다: 저장소를 불러오고, 사용 불가·첫 실행·저장본 세 경우를 처리한 뒤 `mount`한다 — localStorage를 비운 상태에서 앱을 열면 목업 노트 7개가 보이고 Application 탭에 `note:v1:*` 키 7개가 생기는지 확인

## 4. 편집과 저장 상태 연결

- [x] 4.1 `ui-state.svelte.ts`에서 `forced.save`와 관련 파싱, 주석을 제거하고, 선택 변경을 D6·D7의 `selectNote(id | null)`로 모은다(이전 노트 flush, 정렬 고정 설정). `NoteList`의 카드 선택과 `EditorPane`의 뒤로 가기가 이 함수를 쓰게 바꾼다 — `rg "selectedNoteId =" src`의 결과가 `selectNote` 안에만 있는지 확인
- [x] 4.2 `EditorPane`의 `oninput`에서 `updatedAt` 갱신과 `schedule(note.id)`를 부르고, 저장 상태를 D8의 표대로 `statusOf`에서 파생해 `SaveStatusIndicator`에 넘긴다 — 입력 중 "저장 중", 1초 뒤 "저장됨"이 보이는지 확인
- [x] 4.3 D7의 즉시 저장 계기를 붙인다: `visibilitychange`(hidden)와 `pagehide`에서 `flush()`, `window` keydown의 `Cmd/Ctrl+S`에서 `preventDefault()` 후 `flush()` — 입력 직후 `Cmd+S`를 누르면 곧바로 "저장됨"이 되고 브라우저 저장 창이 뜨지 않는지 확인

## 5. 목록 정렬과 수정 시각 문구

- [x] 5.1 `src/lib/clock.svelte.ts`에 60초마다 갱신되는 공용 `now`를, 같은 위치나 별도 모듈에 D9의 `formatUpdatedLabel(updatedAt, now)`를 작성한다 — 임시 호출로 30초 전, 5분 전, 오늘 3시간 전, 어제, 3일 전, 올해 9월 14일, 2025년 날짜, 미래 시각이 스펙 규칙대로 나오는지 확인하고 임시 코드를 지운다
- [x] 5.2 `NoteCard`가 `formatUpdatedLabel(note.updatedAt, clock.now)`를 보여주게 바꾼다 — 첫 실행 화면의 카드 문구가 3.1의 기존 문구 형식과 같은지 확인
- [x] 5.3 `NoteList`에 D6의 정렬과 선택 중 위치 고정을 구현한다 — 1280px에서 다섯 번째 노트를 편집하는 동안 위치가 그대로이고, 다른 노트를 열면 맨 위로 올라가는지 확인

## 6. 검증

- [x] 6.1 `pnpm check`와 `pnpm build`가 경고와 오류 없이 통과
- [x] 6.2 `specs/note-persistence/spec.md`의 모든 시나리오를 브라우저에서 확인한다. 용량 초과는 DevTools 콘솔에서 localStorage를 큰 더미 값으로 채워 재현하고, 저장소 차단은 사이트 데이터 차단 설정으로, 손상 레코드는 콘솔에서 값을 깨뜨려 재현한 뒤 원상 복구한다
- [x] 6.3 `specs/note-ui-skeleton/spec.md` 델타의 시나리오를 확인한다. 정렬 고정은 1280px과 375px(뒤로 가기)에서, `?save=unsaved`를 무시하는지, `?search=empty`와 `?folder=empty`가 계속 동작하는지 포함
- [x] 6.4 `specs/markdown-preview/spec.md` 델타의 "새로고침 후 미리보기" 시나리오를 확인
- [x] 6.5 DevTools 네트워크 탭에서 편집과 저장 중에 네트워크 요청이 없고, Application 탭에서 `note:v1:*` 외의 저장소 키가 생기지 않는지 확인
- [x] 6.6 DESIGN.md를 바꾸지 않았는지(`git diff --stat DESIGN.md .omd`가 비어 있음)와 새 코드에 원시 색상값이 없는지(`rg '#[0-9a-fA-F]{3,6}' src/lib/persistence src/lib/clock.svelte.ts`) 확인
