## Context

- 동기와 범위는 proposal.md, 관찰 가능한 동작은 `specs/note-persistence/spec.md`, `specs/note-ui-skeleton/spec.md`, `specs/markdown-preview/spec.md` 참고.
- 노트 상태는 `src/lib/notes.svelte.ts`의 `NoteDoc` 클래스다. `source`가 유일한 원본이고 제목·미리보기 문장·HTML은 `$derived`로 파생한다. `notes` 배열과 `noteById`는 모듈 로드 시 seed에서 한 번 만들어지며, 배열 구성은 바뀌지 않는다는 전제로 짜여 있다.
- `NoteDoc.dirty`는 한 번 true가 되면 되돌아가지 않는다. `EditorPane`은 `forced.save ?? (dirty ? 'unsaved' : 'saved')`로 저장 상태를 정한다.
- `updatedLabel`은 seed에 적힌 문자열("3분 전")을 그대로 보여준다. 목록은 `notes` 배열 순서 그대로 그려지는데, seed가 최근 순으로 적혀 있어 정렬된 것처럼 보일 뿐이다.
- `main.ts`는 동기로 `mount`한다. SSR이 없는 순수 브라우저 앱이다.
- DESIGN.md의 `save-status-indicator`는 saved / saving / unsaved 세 변형만 정의한다. loading 상태는 "로컬 동작은 즉시 끝난다"는 이유로 not-applicable로 되어 있다.

## Goals / Non-Goals

**Goals:**
- 저장소 구현을 한 파일로 교체할 수 있게 한다. IndexedDB, 파일, 서버로 바꿀 때 조율자와 UI는 고치지 않는다.
- 자동 저장 정책(대기, 최대 대기, 즉시 저장, 상태, 재시도)을 저장소와 무관하게 한곳에 둔다.
- 다음 변경(새 노트/삭제)이 인터페이스를 바꾸지 않고 붙을 수 있게 `remove`와 `cancel`을 미리 둔다.

**Non-Goals:**
- 여러 탭 사이 동기화(`storage` 이벤트 구독). 마지막 쓰기가 남는다.
- 편집 이력, 되돌리기, 충돌 병합.
- 저장소 용량 관리나 오래된 데이터 정리.
- 폴더/태그 데이터의 영속화. 이번에는 노트만 저장한다.

## Decisions

### D1. 계층과 파일 구조

```
 UI (EditorPane, NoteList, NoteCard, SaveStatusIndicator)
   | note.source 바인딩, saveStatus 읽기, flush 요청
   v
 notes.svelte.ts        NoteDoc (source, updatedAt, 파생값), notes 컬렉션, initNotes
   | 편집 알림
   v
 persistence/autosave.svelte.ts   AutosaveController: schedule / flush / cancel / 상태
   | NoteStore 인터페이스만 앎
   v
 persistence/store.ts             NoteStore 인터페이스, NoteRecord 타입, 스키마 검증
 persistence/local-storage-store.ts   LocalStorageStore (이번 구현)

 main.ts                          저장본 불러오기, 첫 실행 seed 기록, initNotes 후 mount
 clock.svelte.ts                  공용 현재 시각, 수정 시각 문구 (D9)
```

- 새 디렉터리 `src/lib/persistence/`에 저장 관련 코드를 모은다.
- `NoteDoc`은 저장소를 직접 부르지 않는다. 편집 시 조율자의 `schedule(id)`만 부른다.
- UI는 `NoteStore`를 import하지 않는다. 저장 상태는 조율자에서 읽는다.
- 대안: `NoteDoc` 안에서 `$effect`로 `source` 변화를 감지해 저장하기. 로드할 때 값을 넣는 것도 변화로 잡혀 불필요한 저장이 생기고, 저장 계기가 컴포넌트 수명에 묶여서 기각했다. 편집 경로(`oninput`)에서 명시적으로 `schedule`을 부른다.

### D2. `NoteStore`는 처음부터 비동기

```ts
interface NoteStore {
  loadAll(): Promise<LoadResult>          // { notes: NoteRecord[], hasAnyRecord: boolean }
  put(note: NoteRecord): Promise<void>    // 실패 시 reject
  remove(id: string): Promise<void>       // 이번 변경에서는 호출하지 않음
}
```

- localStorage는 동기 API지만 인터페이스는 `Promise`를 반환한다. IndexedDB, 파일, 서버는 모두 비동기이므로, 동기 인터페이스로 시작하면 교체할 때 조율자와 부팅 코드를 모두 고쳐야 한다.
- `LocalStorageStore`는 내부에서 동기로 쓰고, 예외(`QuotaExceededError`, `SecurityError`)를 reject로 바꾼다.
- `hasAnyRecord`는 읽을 수 없는 레코드까지 포함해 "노트 레코드 키가 하나라도 있는가"를 뜻한다. 첫 실행 판단(D5)에 쓴다.
- 대안: 동기 인터페이스로 시작하고 나중에 바꾸기. 교체 비용이 조율자와 부팅 코드로 번져서 기각했다.

### D3. 레코드 단위 키와 스키마 버전

```
 key:   "note:v1:<id>"
 value: {"schema":1,"id":"n1","folderId":"work","tagIds":["meeting","todo"],
         "source":"# 3분기 ...","updatedAt":"2026-09-28T04:57:00.000Z"}
```

- 노트 하나가 키 하나다. `put(n1)`은 n1만 직렬화한다. IndexedDB의 object store 레코드나 서버의 `/notes/:id` 리소스와 1:1로 대응한다.
- 제목, 미리보기 문장, HTML은 저장하지 않는다. `source`에서 파생하므로 저장하면 원본이 둘이 된다.
- `updatedAt`은 ISO 8601 문자열이다. JSON으로 그대로 오가고 사람이 읽을 수 있다.
- 키 접두사의 `v1`과 값의 `schema`는 역할이 다르다. 접두사는 이 앱의 레코드를 다른 키와 구분하고, `schema`는 값 형식을 판별한다. 형식이 바뀌면 로드할 때 `schema`를 보고 이관한다.
- 로드할 때 접두사로 키를 모으고, 각 값을 `JSON.parse`와 형식 검사(필드 타입, `schema === 1`)에 통과시킨다. 실패한 레코드는 건너뛰고 지우지 않는다. 모르는 `schema`도 같다. 더 새 버전의 앱이 쓴 데이터를 옛 버전이 덮어쓰지 않게 하기 위해서다.
- 대안: `"notes"` 키 하나에 배열 전체를 저장하기. 한 글자를 고쳐도 모든 노트를 다시 직렬화하고, 레코드 하나가 손상되면 전체를 잃으며, 다른 저장소와 모양이 달라서 기각했다.

### D4. 자동 저장 조율자

노트별 상태:

```
                 schedule                 대기 만료(500ms) / 최대 대기(2s) / flush
  saved -------------------> pending ----------------------------------> writing
    ^                         ^   |  schedule: 대기 타이머 재시작                |
    |                         |   +---------------------------------+         |
    |                         |                                               |
    |                         +---- writing 중 schedule ---> (끝나면 pending) --+
    +------------------------------ 성공 --------------------------------------+
                                                                               |
  failed <------------------------- 실패 --------------------------------------+
    |  schedule / flush -> pending(또는 바로 writing)
```

- 공개 API: `schedule(id)`, `flush(id?)`(id가 없으면 대기 중인 모든 노트), `cancel(id)`, `statusOf(id)`.
- 노트별 타이머와 쓰기 플래그(`debounceTimer`, `maxWaitTimer`, `writing`, `dirtyDuringWrite`, `flushAfterWrite`, `cancelled`)는 일반 `Map`에 두고, 화면이 읽는 `phase`만 `SvelteMap`에 따로 둔다. 타이머 값이 바뀔 때마다 화면이 다시 계산되지 않게 하기 위해서다.
- 쓰는 도중 `flush`가 오면 `flushAfterWrite`를 표시해 두고, 쓰기가 끝나자마자 대기 없이 후속 저장을 한다.
- 쓰는 순간 `source`와 `updatedAt`을 스냅샷으로 떠서 `put`에 넘긴다. 쓰는 동안 들어온 입력은 `dirtyDuringWrite`로 표시하고, 쓰기가 끝나면 다시 `pending`으로 보내 한 번 더 저장한다.
- 같은 노트에 대해 쓰기는 한 번에 하나만 진행한다. 비동기 저장소에서 늦게 끝난 옛 쓰기가 새 쓰기를 덮는 순서 역전을 막는다.
- `cancel(id)`: 타이머를 지우고 대기 중인 쓰기를 버린다. 진행 중인 쓰기는 끝나도 후속 쓰기를 하지 않는다. 다음 변경에서 삭제가 `cancel` 뒤에 `remove`를 부른다.
- 실패하면 `failed`로 두고 자동 재시도 타이머는 두지 않는다. 다음 `schedule`이나 `flush`에서 다시 쓴다. 용량 초과는 기다린다고 풀리지 않으므로 사용자 행동에 맞춰 재시도한다.
- 대기 시간 500ms, 최대 대기 2000ms는 모듈 상수로 둔다.
- 대안: 전역 대기 타이머 하나. 노트 A 대기 중에 B를 편집하면 A의 저장 시점이 밀려서 기각했다. 노트 전환 때 flush하므로 실제로는 동시에 대기하는 노트가 거의 없지만, 노트별 구조가 `cancel`과 상태 표시에 더 자연스럽다.

### D5. 부팅과 첫 실행 seed

```
 main.ts
   store = new LocalStorageStore()
   result = await store.loadAll()          (예외 시 storageUnavailable = true)
   if 사용 불가:           notes = seed로 구성 (메모리만), 쓰기는 실패로 표시
   elif !hasAnyRecord:     notes = seed로 구성, now 기준 updatedAt 계산, 전부 put
   else:                   notes = result.notes로 구성
   mount(App)
```

- 불러오기를 마친 뒤 `mount`한다. localStorage에서는 지연을 체감할 수 없고, 비동기 저장소로 바꿔도 같은 흐름을 유지한다. 로딩 화면은 두지 않는다. DESIGN.md가 로컬 동작을 즉시 완료로 보기 때문이다. 느린 저장소를 도입할 때 다시 검토한다.
- `notes` 컬렉션은 모듈 로드 시 만들 수 없게 되므로 `initNotes(records, store)`로 초기화한다. 이 함수가 `NoteDoc`을 만들고 조율자도 함께 만든다. 조율자는 `note.toRecordFormat()`으로 저장할 스냅샷을 얻는다. 배열은 `$state`로 두지 않는다. 이번 변경에서도 추가·삭제가 없어 구성은 부팅 뒤 바뀌지 않는다. 정렬은 D6에서 파생값으로 한다.
- seed는 `updatedLabel` 대신 분 단위 오프셋 `minutesAgo` 하나를 가진다. 시간·일 단위는 `HOUR`, `DAY` 상수로 적는다(예: `3`, `HOUR`, `DAY`, `7 * DAY`). `seedsToRecordFormat(seeds, now)`가 첫 실행 시각에서 오프셋을 빼 `updatedAt`을 만든다. "9월 21일"처럼 날짜로 적힌 seed도 오늘(9월 28일) 기준 오프셋으로 바꿔 둔다. 그래서 첫 화면 문구는 seed 날짜에 묶이지 않고 날짜 형식으로 표시된다.
- `hasAnyRecord`가 true이면 읽을 수 있는 노트가 0개여도 seed를 적용하지 않는다. 손상된 레코드를 seed가 덮어쓰지 않게 하기 위해서다.
- 저장소를 쓸 수 없으면(`localStorage` 접근 자체가 예외) seed로 화면을 띄우고, 조율자는 매 쓰기를 실패로 처리해 "저장 안 됨"을 보인다.

### D6. 정렬과 선택 중 위치 고정

```ts
// ui-state.svelte.ts
ui.pinnedSortKey: string | null     // 선택된 노트의 고정 정렬 키
function selectNote(id) {           // 선택 변경은 모두 여기를 거친다
  flushNotes(이전 선택)              // D7
  ui.selectedNoteId = id
  ui.pinnedSortKey = id ? noteById.get(id).updatedAt : null
}

// NoteList.svelte
const sortKey = (n) => n.id === ui.selectedNoteId && ui.pinnedSortKey !== null ? ui.pinnedSortKey : n.updatedAt
const sortedNotes = $derived(
  notes.toSorted((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.id.localeCompare(b.id))
)
```

- 선택이 바뀌는 순간 선택된 노트의 `updatedAt`을 정렬 키로 고정한다. 편집으로 `updatedAt`이 바뀌어도 정렬 키는 그대로라 카드가 움직이지 않는다. 선택이 바뀌면 고정이 풀리고 실제 `updatedAt`으로 제자리를 찾는다.
- 고정은 선택 변경 시점에 한 번 잡는다. 선택 변경이 `NoteList`(카드 선택)와 `EditorPane`(뒤로 가기)의 `ui.selectedNoteId = ...` 직접 할당 두 곳에 있었으므로 `selectNote(id | null)` 함수로 모으고, 그 안에서 flush(D7)와 고정을 함께 처리한다. 고정 키는 선택과 함께 바뀌는 UI 상태라 `ui`에 둔다.
- 대안: `$effect`로 `ui.selectedNoteId`를 따라가며 고정하기. 이전 노트 flush(D7)를 위해 어차피 선택 변경 함수가 필요하고, 선택과 고정이 한 곳에서 함께 바뀌는 편이 추적하기 쉬워서 기각했다.
- `updatedAt`은 ISO 문자열이라 문자열 비교로 정렬할 수 있다. 같은 값이면 id로 순서를 고정한다.
- 대안: 입력마다 재정렬. 3단 레이아웃에서 첫 글자를 치는 순간 카드가 점프해서 기각했다. 대안: 새로고침 때만 정렬. "방금 전" 카드가 목록 중간에 남아 최근 노트 훑어보기와 맞지 않아서 기각했다.

### D7. 즉시 저장 계기와 단축키

- `document`의 `visibilitychange`(hidden)와 `window`의 `pagehide`에서 `flush()`를 부른다. `beforeunload` 확인 창은 쓰지 않는다. 자동 저장이 곧바로 끝나므로 사용자를 붙잡을 이유가 없다.
- `pagehide` 안에서는 비동기 작업이 끝난다는 보장이 없다. `LocalStorageStore.put`은 `Promise` 안에서 동기로 쓰므로 `flush` 호출 시점에 실제 쓰기가 끝난다. 비동기 저장소로 바꾸면 이 보장이 사라지므로, 그때는 `visibilitychange`를 주 계기로 삼는다. 이 점을 `NoteStore` 주석에 남긴다.
- `selectNote`는 이전 노트를 `flush(prevId)`한 뒤 선택을 바꾼다. 좁은 폭의 뒤로 가기도 `selectNote(null)`을 거친다.
- `Cmd/Ctrl+S`는 `window` keydown에서 `preventDefault()` 후 `flush()`를 부른다. 노트가 선택되지 않았을 때도 브라우저 저장 창은 막는다. 에디터 안에서만 막으면 목록에 포커스가 있을 때 브라우저 창이 떠서 일관되지 않다.
- 세 리스너는 `EditorPane`에 `<svelte:window>`, `<svelte:document>`로 등록한다. `EditorPane`은 좁은 폭에서 숨겨져도 항상 마운트되어 있어 앱 전체 리스너 역할을 한다.

### D8. 저장 상태 대응과 `dirty` 제거

| 조율자 phase | 표시 변형 | 문구 |
|---|---|---|
| pending, writing | saving | 저장 중 |
| saved | saved | 저장됨 |
| failed | unsaved | 저장 안 됨 |

- `NoteDoc.dirty`와 `forced.save`를 제거한다. `EditorPane`은 조율자의 `statusOf(note.id)`를 위 표로 바꿔 `SaveStatusIndicator`에 넘긴다. 컴포넌트와 DESIGN.md는 바꾸지 않는다.
- 조율자 phase는 4개, 표시는 3개다. 나중에 쓰기가 오래 걸리는 저장소를 쓰게 되어 대기와 진행을 구분할 필요가 생기면, 조율자는 그대로 두고 표시 변형만 늘리면 된다.
- `SaveStatusIndicator`는 `role="status"`라 문구가 바뀔 때마다 스크린 리더가 읽는다. 타이핑하는 동안 "저장 중"과 "저장됨"이 번갈아 읽힐 수 있다. 표시가 실제로 바뀌는 횟수는 대기 시간 덕분에 입력 멈춤마다 한 번 정도라 그대로 둔다. 실제로 거슬리면 `aria-live="polite"`와 실패 때만 알리는 방식으로 조정한다.

### D9. 수정 시각 문구

- `formatUpdatedLabel(updatedAt, now)` 순수 함수를 둔다. 규칙은 note-ui-skeleton 스펙의 "수정 시각 문구"를 따른다.
- `now`는 공용 `$state` 하나로 두고 60초마다 갱신한다(`clock.svelte.ts`). 카드마다 타이머를 두지 않는다.
- 시계는 모듈을 불러올 때 시각을 잡으므로 첫 실행 seed의 기준 시각보다 몇 ms 이르다. 그대로 두면 "3분 전" seed가 "2분 전"으로 보인다. `main.ts`가 `initNotes` 뒤, `mount` 앞에서 `clock.now`를 한 번 갱신한다.
- `NoteCard`는 `note.updatedLabel` 대신 `formatUpdatedLabel(note.updatedAt, clock.now)`를 보여준다. 편집 직후에는 `now`가 아직 갱신되지 않았을 수 있으므로, 계산에서 경과 시간이 1분 미만(음수 포함)이면 "방금 전"으로 처리한다.
- `updatedAt`은 입력 시점에 갱신한다. `oninput`에서 `schedule`과 함께 `note.updatedAt = new Date().toISOString()`을 설정한다.

## Risks / Trade-offs

- [여러 탭에서 같은 노트를 편집하면 나중에 쓴 탭이 이긴다] → 이번 범위 밖으로 명시한다. `storage` 이벤트 구독은 `LocalStorageStore`에 붙일 수 있는 확장으로 남긴다.
- [localStorage 용량(대략 5MB)] → 텍스트 노트 수백 개 수준에서는 충분하다. 넘치면 "저장 안 됨"으로 드러나고 편집 내용은 세션에 남는다. 용량이 문제가 되면 IndexedDB 어댑터로 교체한다.
- [다른 노트를 열 때 이전 노트 카드가 맨 위로 이동해, 방금 누른 카드의 위치가 한 칸 밀릴 수 있다] → 클릭은 이미 처리된 뒤라 선택은 정확하다. 키보드 포커스는 카드 요소를 따라가므로 잃지 않는다(`{#each}` key가 id). 시각적 이동이 거슬리면 모션 토큰 범위에서 전환을 검토한다.
- [`pagehide`에서 비동기 저장소의 쓰기가 끝나지 않을 수 있다] → 이번 localStorage 구현에서는 동기로 끝난다. 교체 시 주의점을 인터페이스 주석에 남긴다(D7).
- [부팅을 await하게 바뀌어, 저장소가 느리면 첫 화면이 늦어진다] → localStorage에서는 무시할 수 있다. 느린 저장소를 도입할 때 로딩 상태를 DESIGN.md와 함께 설계한다.
- [seed 오프셋 변환으로 첫 화면 문구가 기존과 달라질 수 있다("9월 21일"은 실행 날짜에 따라 다른 날짜로 보인다)] → 목업의 목적은 문구 형식별 예시를 보여주는 것이므로 받아들인다.

## Migration Plan

- 기존 사용자 데이터는 없다(지금까지는 저장하지 않았다). 배포 후 첫 실행이 곧 D5의 첫 실행 경로다.
- 되돌리기: 이 변경을 되돌리면 앱은 저장소를 읽지 않고 다시 seed로 동작한다. 남은 `note:v1:*` 키는 무해하며, 이후 다시 배포하면 그대로 이어서 쓴다.
