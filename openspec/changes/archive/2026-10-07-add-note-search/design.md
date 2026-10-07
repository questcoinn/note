## Context

동기는 proposal.md의 Why를, 동작은 `specs/note-search/spec.md`를 본다. 여기서는 지금 코드가 이 설계를 어떻게 제약하는지만 적는다.

- `SearchInput`은 `bind:value`만 있는 뼈대다. 값은 `NoteList`의 지역 `$state`(`query`)이고, `forced.searchEmpty`일 때만 예시 검색어로 채워진다. `ui-state.svelte.ts`의 `readForced()`, `forced`, `FORCED_SEARCH_QUERY`에는 "검색 기능 단계에서 제거한다"는 주석이 있다.
- 목록은 `scopedNotes()`(범위 필터) → 정렬(선택 노트는 `pinnedSortKey`로 위치 고정) 순서다. 빈 상태 분기는 `NoteList`의 `{#if}` 체인이고, `listEmptyShowsNewNote()`가 에디터 빈 상태의 "새 노트" 버튼과 중복되지 않게 맞춘다.
- `NoteDoc`은 `source` → `#tokens = $derived(parse(source))` → `html`, `title`, `snippet`을 노트마다 지연 계산하고 메모이즈한다. `render.ts`의 `collectBlocks()`는 제목(`heading`), 문단(`paragraph`, 목록·인용 안 포함), 코드(`fence`, `code_block`)의 inline 토큰을 서식 기호 없는 줄로 바꾼다. 이미지 대체 텍스트와 인라인 코드는 들어가고 링크 주소는 빠진다. 표 셀(`th`, `td`의 inline)은 `paragraph_open` 뒤에 오지 않아 빠진다.
- 카드 스니펫은 CSS로 두 줄까지만 보인다(`line-clamp: 2`).
- 전역 단축키 선례는 `EditorPane`의 `Cmd/Ctrl+S`다(`metaKey || ctrlKey`, alt·shift 없음, `key.toLowerCase()`). 삭제 확인과 폴더 이름 다이얼로그는 `showModal()`로 열리는데, 모달 안에서 누른 키도 `window`의 `keydown`에 닿는다.
- 범위를 바꾼 뒤 `#note-list-title`로 포커스를 옮기는 선례가 태그 칩, 사이드바, 노트 삭제에 있다.
- 좁은 폭(767px 이하)에서는 노트가 선택되어 있으면 목록 영역이 `display: none`이다. "목록으로" 버튼은 `selectNote(null)`을 부른다.

## Goals / Non-Goals

**Goals:**
- 검색을 범위 필터 위의 필터 하나로 둔다. 새 범위 종류나 모드를 만들지 않는다.
- 검색용 텍스트는 이미 메모이즈된 토큰에서 파생해, 노트를 고칠 때만 그 노트의 것을 다시 계산한다.
- 일치 판정, 하이라이트 구간, 발췌 계산은 DOM 없는 순수 함수로 두고, 화면에는 `{@html}` 없이 글자 조각과 `<mark>`로 그린다.

**Non-Goals:**
- 역색인이나 검색 라이브러리. 로컬 노트 수(수백 개 이하)에서는 매 입력마다 전체를 훑는 비용이 문제되지 않는다.
- 검색어 입력 디바운스. 매 입력마다 결과를 바로 갱신하는 것이 스펙이다.

## Decisions

### D1. 검색용 텍스트 파생

- `render.ts`에 `extractSearchText(tokens)`를 둔다. 반환값은 `{ title: string; body: string[] }`이다. `title`은 제목으로 쓴 글자이고 대체 제목이면 `''`다. `body`는 제목 줄을 뺀 나머지 줄을 문서 순서대로 담는다.
- 블록 수집은 `collectBlocks()`와 같은 규칙에 표 셀을 더한다. `th_open`, `td_open` 뒤의 inline도 `inlineLines()`로 바꾼다. 제목 결정은 기존 `findTitle()`(표 셀을 모르는 블록 목록 기준)을 그대로 쓴다. 표 셀을 넣어 제목·스니펫 규칙(`markdown-preview` capability)까지 바뀌는 일을 막기 위해서다.
  - 구현은 `collectBlocks()`가 표 셀을 `kind: 'cell'` 블록으로 함께 모으고, `findTitle()`과 스니펫 선택이 `cell`을 건너뛰게 한다. 같은 순회를 두 벌 두면 규칙이 어긋나기 쉽다.
- `NoteDoc`에 `searchText = $derived(extractSearchText(this.#tokens))`를 둔다. 지연 계산이라 검색하기 전에는 비용이 없다.
- 대안으로 `html`을 DOM에 넣고 `textContent`를 읽는 방법을 검토했다. 렌더 결과와 정확히 같다는 장점이 있지만 노트마다 DOM 파싱이 들고 체크박스 `aria-label`, `이미지:` 접두사 같은 렌더러 부산물이 섞여서 기각했다.

### D2. 정규화와 일치 판정

- 새 모듈 `src/lib/search.ts`에 순수 함수를 둔다.
  - `fold(text)`: NFC 정규화 뒤 `toLocaleLowerCase('ko')`. 태그 비교(`tagKey`)와 같은 소문자 규칙이다.
  - `searchTerms(query)`: `fold(query)`를 공백(`/\s+/u`)으로 나누고 빈 단어를 버린다. 중복 단어는 하나로 합친다.
  - `matches(searchText, terms)`: 제목과 본문 줄을 `'\n'`으로 이은 문자열의 `fold`에 모든 단어가 `includes`로 들어 있는지 본다. 단어에는 공백이 없어서 줄 경계를 넘어 일치하는 일은 없다.
- 이은 뒤 fold한 문자열은 `NoteDoc`에 `$derived`로 메모이즈한다. 입력할 때마다 노트 수만큼 `includes`만 돈다.
- `terms`는 `ui.searchQuery`에서 `$derived`로 한 번 계산하고, 목록과 카드가 함께 쓴다.

### D3. 하이라이트 구간과 인덱스 대응

- 하이라이트 구간은 화면에 그리는 원래 글자의 인덱스여야 한다. 그런데 fold 결과는 원문과 길이가 다를 수 있다(NFD 한글이 NFC로 합쳐지거나, `İ` 같은 글자가 소문자화로 두 글자가 된다).
- 그래서 화면에 그리는 글자는 NFC로 정규화한 제목과 줄을 쓴다. NFC는 보기에 원문과 같다. 소문자화는 코드 포인트 단위로 하면서 fold 인덱스 → 원래 인덱스 대응표를 만든다. 대부분의 줄은 길이가 변하지 않으니, 길이가 같으면 대응표를 만들지 않는다.
- `highlightRanges(text, terms)`는 겹치거나 맞닿은 구간을 합친 `[start, end)` 목록을 돌려준다. 짧은 단어가 긴 단어 안에 들어가도(`회의`, `회의록`) 합쳐져 한 `<mark>`가 된다.
- 대안으로 정규식(`new RegExp(escaped, 'giu')`)을 원문에 직접 거는 방법을 검토했다. NFC/NFD 차이를 정규식으로 다룰 수 없어서 기각했다.

### D4. 결과 카드

- `NoteList`가 검색 중일 때 카드마다 `{ title: Segment[]; excerpt: Excerpt | null }`을 계산해 `NoteCard`에 넘긴다. `Segment`는 `{ text; mark: boolean }`이다. 검색 중이 아니면 넘기지 않고, 카드는 지금처럼 그린다.
- 발췌 규칙
  - 본문 줄 가운데 어떤 검색 단어든 처음 나오는 줄을 고른다. 없으면 `excerpt`가 `null`이고, 카드는 원래 스니펫을 하이라이트 없이 보여준다.
  - 그 줄의 첫 일치 앞 글자가 24자를 넘으면 앞을 잘라 `…`로 시작한다. 자르는 자리는 일치 앞 24자 안에서 가장 먼 공백 뒤로 하고, 공백이 없으면 24자 자리에서 자른다.
  - 뒤쪽은 자르지 않고 기존 스니펫의 두 줄 제한(`line-clamp`)에 맡긴다. 앞만 자르면 일치 부분이 늘 첫 줄 근처에 온다.
  - 하이라이트는 발췌 안의 모든 검색 단어다.
- 마크업은 `<mark class="hit-mark">`다. 색은 `color.weak-background` 배경과 `color.weak-foreground` 글자다. `.note-card.selected mark`는 배경을 `color.canvas`로 바꾼다(태그 칩의 selected 카드 규칙과 같다). 글자 사이에 붙은 배경이 어색하지 않게 `border-radius: var(--radius-sm)`만 주고 여백은 두지 않는다.
- 카드 제목 버튼의 접근 가능한 이름은 `<mark>`가 들어가도 제목 글자 그대로다.

### D5. 빈 상태 분기와 "전체 노트에서 보기"

- `NoteList`의 분기 순서는 이렇다.
  1. 태그 범위 빈 상태
  2. 폴더 범위 빈 상태
  3. 노트 없음
  4. 폴더 없음 비어 있음
  5. **검색 결과 없음**
  6. 카드 목록

  1–4는 지금 조건(`inScopeNotes.length === 0`)을 그대로 쓰고, 맨 앞의 `forced.searchEmpty` 분기는 지운다.
- 검색 결과 없음에서, 범위가 `all`이 아니면 `notes`(전체) 가운데 일치하는 개수 `n`을 센다. `n > 0`이면 설명을 "다른 곳에 일치하는 노트가 {n}개 있어요."로 하고, `PrimaryButton` "전체 노트에서 보기"를 둔다. 아니면 설명은 "검색어를 줄이거나 다른 단어로 찾아보세요."이고 버튼은 없다.
- 버튼은 `selectScope({ kind: 'all' })` 뒤에 `tick()`을 기다리고 `#note-list-title`에 포커스를 준다. 태그 칩(`openTagScope`)과 같은 흐름이라 함수 하나(`selectScopeAndFocusTitle`)로 합친다.
- `listEmptyShowsNewNote()`에서 `forced.searchEmpty` 조건만 지운다. 검색 결과 없음은 범위에 노트가 있을 때만 나오므로, 기존 `scopedNotes().length > 0 → false` 분기가 이미 "버튼 없음"을 돌려준다.
- 기록 전 새 노트는 원문이 비어 있어 어떤 검색에도 걸리지 않는다. 검색 중에 "새 노트"를 누르면 새 카드는 목록에 나타나지 않고 에디터에만 열린다. 열린 노트를 닫지 않는 규칙(D6)과 같은 동작이라 따로 처리하지 않는다.

### D6. 검색어 상태

- `ui.searchQuery = ''`를 `ui-state.svelte.ts`의 `ui`에 둔다. `SearchInput`은 `bind:value={ui.searchQuery}`다. 범위 전환(`selectScope`), `startNewNote`, `selectNote`는 이 값을 건드리지 않는다.
- 이 값을 `ui`에 두는 이유는 두 가지다. 단축키 처리와 "전체 노트에서 보기"가 `NoteList` 밖에서도 같은 값을 봐야 하고, 새로고침하면 지워진다는 규칙이 `ui`의 다른 필드(범위, 선택)와 같기 때문이다.
- `readForced()`, `forced`, `FORCED_SEARCH_QUERY`, `Forced` 타입을 지운다. `?search=empty` 쿼리는 아무 효과가 없다.

### D7. 단축키와 Esc

- `Cmd/Ctrl+K`는 `App.svelte`의 `<svelte:window onkeydown>`에서 처리한다. 사이드바, 목록, 에디터 상태를 모두 건드리므로 어느 한 영역 컴포넌트보다 앱 수준이 맞다. 판정식은 `Cmd/Ctrl+S`와 같은 모양이다.
- 처리 순서
  1. `document.querySelector('dialog:modal')`이 있으면 아무것도 하지 않는다.
  2. `preventDefault()`를 부른다.
  3. `ui.sidebarOpen`이면 `false`로 바꾼다. 오버레이의 `close()`와 달리 포커스를 토글 버튼으로 돌리지 않는다.
  4. `matchMedia('(max-width: 767px)')`가 맞고 노트가 선택되어 있으면 `selectNote(null)`을 부른다. "목록으로" 버튼과 같은 경로라 기록 전 새 노트 정리와 저장 flush가 그대로 적용된다.
  5. `tick()`을 기다린 뒤 검색 입력(`#note-search-input`)에 `focus()`와 `select()`를 한다.
- `Esc`는 `SearchInput`의 `onkeydown`에서 처리한다. `event.isComposing`이면 무시한다(태그 입력과 같은 정책, 프로젝트 브라우저 기준상 우회 코드 없음). 값이 있으면 지우고 `preventDefault()`한다. 값이 없으면 아무것도 하지 않는다.
- 단축키를 `/`로 하는 방안은 원문 입력 중에 쓸 수 없어서, `Cmd/Ctrl+F`는 브라우저 찾기를 빼앗아서 기각했다(탐색 단계 결정).

## Risks / Trade-offs

- [조합 중 필터링으로 빈 상태가 깜빡임: `예산`을 치는 중간값 `옛`에 일치가 없으면 결과 없음이 잠깐 보인다] → 탐색 단계에서 받아들이기로 했다. 결과 없음 빈 상태에는 애니메이션이 없어 깜빡임이 한 프레임 정도의 교체로 끝난다.
- [첫 검색 때 모든 노트의 검색용 텍스트를 한꺼번에 파생] → 토큰은 이미 메모이즈되어 있고 inline 순회만 더한다. 노트 수백 개 규모에서 문제가 되면 첫 입력 때만 한 번 드는 비용이다. 7.x 확인에서 노트 500개로 입력 지연을 잰다.
  - 7.2 측정 결과(2026-10-07, 노트 500개, 노트당 약 1,900자): 검색용 텍스트 첫 파생은 114ms(개발 빌드)로 예상한 한 번의 비용이다. 이후 일치 판정은 500개에 2ms, 일치한 475개의 하이라이트와 발췌는 16ms다.
  - 입력 한 번의 처리 시간(프로덕션 빌드, 입력부터 DOM 갱신과 레이아웃까지, paint 제외)은 그리는 카드 수에 비례한다. 카드 475~500개는 첫 입력 494~704ms, 이후 입력 131~667ms다. 15개는 43ms, 1개는 2ms, 일치 없음은 35~64ms다.
  - 검색어를 지워 카드 500개를 다시 그릴 때도 214~556ms가 걸린다. 100ms를 넘는 원인은 검색이 아니라 목록이 모든 카드를 한꺼번에 그리는 구조다. 검색은 입력마다 카드를 다시 그리게 해서 이 비용을 드러낼 뿐이다.
  - 받아들이기로 했다. 노트 수십~수백 개에 일치가 적은 실제 사용에서는 수십 ms 안쪽이다. 카드 수에 비례하는 목록 렌더링 비용(가상화, `content-visibility` 등)은 별도 변경에서 다룬다.
  - 측정 한계: 브라우저 패널이 숨겨진 상태라 다음 화면까지의 시간은 재지 못했다. 입력은 합성 이벤트였다. 거의 모든 노트가 일치하는 최악에 가까운 데이터를 썼다.
- [`Cmd/Ctrl+K`가 브라우저 단축키(주소창 검색)와 겹침] → 페이지에 포커스가 있을 때만 가로챈다. 주소창에 포커스가 있을 때는 브라우저 동작 그대로다.
- [검색 중 "새 노트" 카드가 목록에 안 보여 새 노트가 만들어졌는지 헷갈릴 수 있음] → 에디터에 새 노트가 열리고 원문에 포커스가 간다. 실제 사용에서 문제가 되면 "검색 중 새 노트는 검색어를 지운다" 같은 규칙을 별도 변경으로 검토한다.
- [하이라이트 인덱스 대응 버그로 `<mark>`가 엉뚱한 글자에 걸림] → 인덱스 대응을 순수 함수로 두고, NFD 한글과 `İ`, 이모지(서로게이트 쌍) 입력을 콘솔에서 확인하는 작업을 둔다.
