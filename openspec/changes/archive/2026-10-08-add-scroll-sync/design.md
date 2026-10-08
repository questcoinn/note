## Context

동기는 proposal.md의 Why를, 동작은 `specs/editor-scroll-sync/spec.md`를 본다. 여기서는 지금 코드가 이 설계를 어떻게 제약하는지만 적는다.

- 원문은 `EditorPane`의 `<textarea class="source" bind:value={note.source}>`이고 `source` 변수에 `bind:this`로 잡혀 있다. textarea는 `.source-pane`(flex) 안에서 높이를 채우므로 스크롤은 **textarea 자체**가 한다. 자동 줄바꿈이 켜져 있고 글꼴은 mono 14px/22px다.
- 미리보기는 `<div class="pane preview">{@html note.html}</div>`이고 스크롤은 이 `.pane`(`overflow-y: auto`)이 한다. 지금은 `bind:this`가 없다.
- `note.html`은 `NoteDoc`에서 `parse(source)` 토큰 → `renderHtml(tokens)`로 파생된다. markdown-it 블록 토큰에는 원문 줄 범위 `token.map = [시작줄, 끝줄)`이 있다. `renderHtml`은 DOMPurify로 정화하며, 기본 설정은 `data-*` 속성을 남긴다(`ALLOW_DATA_ATTR: true`). 표는 `table_open` 규칙이 `<div class="table-scroll">`로 감싼다.
- 1024px 미만에서는 `.panes[data-tab]`이 안 보이는 쪽을 `display: none`으로 숨긴다. 숨은 요소는 폭이 0이어서 줄바꿈이나 `offsetTop`을 잴 수 없다. 탭은 `ui.editorTab`이고, 노트를 열면 `selectNote`가 `'edit'`로 되돌린다.
- textarea와 미리보기 요소는 노트마다 새로 만들지 않는다(`{#key}`가 없다). 그래서 지금은 다른 노트를 열어도 이전 스크롤 위치가 남는다.
- 앱 어디에도 `scroll-behavior: smooth`가 없다. `scrollTop` 대입은 즉시 이동이다.
- 테스트 러너가 없다. 지난 변경들은 순수 함수를 개발 서버에서 `import()`해 콘솔로 확인했다.

## Goals / Non-Goals

**Goals:**
- 위치 대응 규칙(앵커, 보간, 끝 맞춤)은 DOM을 모르는 순수 함수로 둔다. 측정과 이벤트 처리는 그 밖에 둔다.
- 넓은 화면의 실시간 동기화, 탭 전환, 재렌더, 리사이즈가 같은 변환 두 개(원문 y ↔ 논리 위치 ↔ 미리보기 y)를 함께 쓴다.
- 기존 렌더 결과의 모양과 정화 규칙은 바꾸지 않는다. 속성 하나만 더한다.

**Non-Goals:**
- 캐럿 따라가기, 동기화 토글, 노트별 스크롤 위치 기억(proposal의 범위 제외).
- 블록 안쪽(표의 행, 코드 블록의 줄, 긴 문단의 줄) 단위의 정밀한 대응. 블록 사이는 비례 보간으로 채운다.
- 원문 영역을 CodeMirror 같은 에디터로 바꾸는 일. 바꾸게 되면 원문 쪽 측정(D3)만 다시 쓴다.

## Decisions

### D1. 논리 위치는 "원문 줄 번호(소수)"다

- 두 영역 사이에 오가는 값을 px가 아니라 `SourcePos = { line: number, atEnd: boolean }`로 둔다. `line`은 0부터 세는 원문 줄 번호이고, 소수 부분은 그 줄이 화면에서 차지하는 높이 안에서의 비율이다(42.6 = 42번 줄 높이의 60% 지점). `atEnd`는 기준 쪽이 맨 아래에 닿아 있었다는 뜻이다.
- px로 두면 숨은 쪽을 잴 수 없는 좁은 화면, 줄바꿈이 바뀌는 리사이즈에서 값이 무의미해진다. 줄 번호는 레이아웃과 상관없이 남는다.
- 상태는 `ScrollSync` 인스턴스 하나가 갖는다. 기준 쪽(`owner: 'source' | 'preview'`), 마지막 논리 위치, 각 영역에 마지막으로 넣은 `scrollTop`(D5)이다.

### D2. 미리보기 앵커: 블록 요소에 `data-source-line`

- `render.ts`에 core 규칙 `source-line`을 더한다. `block`이고 `map`이 있고 `nesting !== -1`인 토큰에 `data-source-line = map[0]`을 넣는다. 대상은 문단, 제목, 목록 항목, 인용, 표, 코드 블록(fence, code_block), 구분선이다. 표 속성은 `<table>`에 붙고, fence 속성은 기본 렌더러대로 `<code>`에 붙는다. 둘 다 그 블록이 그려진 위쪽 끝과 거의 같아 그대로 쓴다.
- 목록 안의 문단처럼 같은 줄 번호가 여러 요소에 붙으면 문서 순서상 첫 요소(바깥 요소)를 쓴다. 이 정리는 측정 쪽(D4)에서 한다.
- `title`, `snippet`, `searchText`는 토큰의 inline 내용만 읽으므로 속성이 늘어도 영향이 없다. 카드와 검색은 `html`을 쓰지 않는다.
- DOMPurify 설정이 바뀌어 속성이 조용히 사라지면 동기화가 비율 매핑(앵커 없음)으로 떨어진다. 그래서 `render.ts`의 정화 호출 옆에 이 속성에 기대는 곳이 있다는 주석을 남기고, tasks에서 렌더 결과에 속성이 남는지 확인한다.
- 대안으로 미리보기 DOM을 원문과 다시 맞추는 방식(텍스트 대조)을 검토했다. 토큰이 이미 줄 범위를 알려 주므로 기각했다.

### D3. 원문 쪽 측정: 숨은 mirror로 줄의 y를 잰다

- textarea는 줄의 y를 알려 주지 않는다. 그래서 화면 밖에 textarea와 같은 글꼴, 크기, 줄 높이, 패딩, `white-space: pre-wrap`, `overflow-wrap`, `tab-size`, 폭(`textarea.clientWidth`, 스크롤바 제외)을 가진 `div`를 만든다. 원문의 각 줄을 그 안의 블록 요소 하나로 넣고 각 요소의 `offsetTop`을 읽어 `lineTops[]`를 만든다. 빈 줄은 줄 높이를 지키도록 빈 글자(`​`) 하나를 넣는다.
- 스타일은 `getComputedStyle(textarea)`에서 복사한다. CSS가 바뀌어도 mirror가 따라간다. mirror는 `ScrollSync`가 하나 만들어 `aria-hidden`, `visibility: hidden`, `position: absolute`로 문서에 둔다.
- 다시 재는 시점은 원문 값이 바뀔 때와 textarea 폭이 바뀔 때뿐이다. 다시 재야 한다는 표시만 해 두고 다음 동기화 때 잰다.
- 대안으로 고정폭 글꼴을 가정해 글자 수로 줄바꿈을 계산하는 방식을 검토했다. 한글이 영문의 두 배 폭이고 줄바꿈 위치가 단어 경계를 따르므로 기각했다.
- 위험: mirror와 textarea의 줄바꿈이 다르면 긴 줄이 많은 노트에서 어긋남이 쌓인다. 가장 먼저 확인할 부분이다(tasks 2.2).

### D4. 대응 함수: 매듭(knot) 사이의 선형 보간

- 순수 모듈 `src/lib/scroll-sync/map.ts`에 다음을 둔다.
  - `lineAt(lineTops, y) → line(소수)`과 그 역 `yOfLine(lineTops, line) → y`. 이분 탐색과 줄 높이 안의 비율.
  - `buildKnots(anchors, lineTops, srcMax, pvMax) → Knot[]`. `anchors`는 `{ line, top }[]`이고 `top`은 미리보기 스크롤 영역 안의 y다. 매듭 `(srcY, pvY)`는 `(0, 0)`, 각 앵커의 `(yOfLine(line), top)`, 그리고 `(srcMax, pvMax)` 순이다. `srcMax`, `pvMax`는 각 영역의 `scrollHeight - clientHeight`다.
  - 정리 규칙: 같은 줄 앵커는 첫 것만 남긴다. 양쪽 y 중 하나라도 앞 매듭보다 작거나 같으면 버린다. 어느 한쪽 끝을 넘는 매듭도 버린다. 그러면 매듭은 양쪽 모두 증가하고, 마지막 매듭이 양쪽 끝이 된다.
  - `srcToPv(knots, y)`, `pvToSrc(knots, y)`: 매듭 사이 선형 보간.
- 마지막 매듭을 양쪽 끝으로 두면 "끝과 끝 맞춤"이 따로 분기 없이 성립한다. 마지막 블록 뒤의 빈 줄이나, 미리보기가 더 짧은 경우에도 그렇다.
- 기준 쪽의 위치는 영역의 위쪽 끝(`scrollTop`)이다. 스펙의 "영역 맨 위에 보이는 내용"과 같다.
- 앵커가 하나도 없으면(빈 노트, 정화 설정 변경) 매듭이 `(0,0)`과 `(srcMax, pvMax)`뿐이라 비율 매핑이 된다.
- 미리보기 앵커의 `top`은 `el.getBoundingClientRect().top - preview.getBoundingClientRect().top + preview.scrollTop`로 잰다. `offsetTop`은 `offsetParent`가 미리보기가 아닐 수 있어 쓰지 않는다. 미리보기가 다시 그려지거나 폭이 바뀔 때만 다시 잰다.
- 측정값을 쓸 때마다 두 영역의 크기가 잴 때와 같은지 본다. Chrome은 textarea 폭이 바뀌면 보던 줄을 지키려고 직접 스크롤하는데, 그 스크롤 이벤트가 `ResizeObserver`보다 먼저 온다. 이전 폭으로 잰 값으로 논리 위치를 계산하지 않기 위해서다.
- 논리 위치와 미리보기 y 사이의 변환은 줄 공간 매듭(`buildLineKnots`: `(0, 0)`, 앵커의 `(line, top)`, `(줄 수, pvMax)`)을 쓴다. 좁은 화면에서는 원문이 숨어 있어 원문 줄의 y를 잴 수 없기 때문이다. y 매듭은 두 영역이 함께 보일 때의 실시간 전파에만 쓴다.

### D5. 기준 쪽(owner)과 루프 방지

- 기준 쪽은 사용자 입력으로 정한다. 각 영역의 `wheel`, `touchstart`, `pointerdown`, `keydown`, `focusin`이 일어나면 그 영역이 기준이 된다. 스크롤바를 끄는 것도 그 요소의 `pointerdown`이라 같이 잡힌다.
- 안전망으로 기대값을 비교한다. 프로그램으로 `scrollTop`을 넣을 때 그 값을 기억해 두고, 따라오는 쪽의 `scroll` 이벤트에서 현재 값이 기억한 값과 1px 안쪽이면 무시한다. 기준이 아닌 쪽에서 기대값과 다른 `scroll`이 오면(찾기, 캐럿을 보이게 하는 브라우저 스크롤 등) 그 쪽을 기준으로 바꾸고 전파한다.
- 전파는 `requestAnimationFrame`으로 한 프레임에 한 번만 한다. 그 프레임에서 기준 쪽의 최신 `scrollTop`을 읽어 상대 쪽에 넣고, 논리 위치를 갱신한다.
- 전파는 상대 쪽이 화면에 그려져 있을 때만 한다(`getClientRects().length > 0`). 1024px 분기를 스크립트에 따로 두지 않으려는 결정이다. CSS가 숨긴 쪽은 자연히 건너뛴다.
- 대안으로 기대값 비교만 쓰는 방식을 검토했다. 보간 오차와 브라우저의 소수 `scrollTop` 반올림 때문에 값이 1px 넘게 어긋나면 되먹임이 생겨 기각했다.

### D6. 시점별 다시 맞춤

| 시점 | 감지 | 동작 |
|---|---|---|
| 기준 쪽 스크롤 | `scroll` + D5 | 기준 쪽 `scrollTop` → 논리 위치 → 상대 쪽 |
| 미리보기 재렌더 | `$effect`가 `note.html` 변경 뒤 DOM 갱신을 본다 | 앵커와 원문 줄을 다시 재야 한다고 표시. 입력이 150ms 멈춘 뒤 기준 쪽 `scrollTop`은 그대로 두고 상대 쪽만 다시 맞춘다 |
| 폭/높이 변경 | 두 영역의 `ResizeObserver` | 다시 재야 한다고 표시. 저장된 논리 위치로 기준 쪽을 먼저 되돌린 뒤 상대 쪽을 맞춘다 |
| 탭 전환(1024px 미만) | 탭 클릭, 그리고 새로 보이는 쪽의 `ResizeObserver`(`display: none`에서 보이게 되면 크기가 바뀐다) | 바꾸기 전 보이던 쪽에서 논리 위치를 읽고, 새로 보이는 쪽을 잰 다음 그 위치로 옮긴다. 새로 보이는 쪽이 기준이 된다 |
| 노트 전환 | `note.id` 변경 | 두 영역 `scrollTop = 0`, 기준은 원문, 논리 위치는 `{ line: 0, atEnd: false }` |

- 재렌더 때 저장된 논리 위치를 쓰지 않고 기준 쪽 `scrollTop`을 다시 읽는 이유: 기준 쪽 위에서 줄을 넣거나 지우면 줄 번호가 밀린다. 그런데 textarea는 입력으로 `scrollTop`을 바꾸지 않으므로 px 쪽이 사용자가 보는 자리를 더 잘 지킨다.
- 리사이즈 때는 반대로 논리 위치를 쓴다. 줄바꿈이 바뀌면 같은 px가 다른 내용을 가리키기 때문이다.
- 탭 전환은 클릭 처리 안에서 바꾸기 전 위치를 읽어야 한다. 바뀐 뒤에는 이전 쪽이 이미 숨겨져 있다. `EditorPane`의 탭 `onclick`이 `ui.editorTab`을 바꾸기 전에 `sync.capture()`를 부르고, 새로 보이는 쪽은 `ResizeObserver`가 알아채 리사이즈와 같은 경로로 옮긴다. 따로 `restore()`를 두지 않는다. `startNewNote`처럼 탭을 코드에서 바꾸는 곳은 노트 전환이 함께 일어나 맨 위로 가므로 capture가 필요 없다.
- 재렌더 뒤 다시 맞추기를 키 입력마다 하지 않고 입력이 멈춘 뒤 한 번만 한다. 5,000줄 노트에서 측정(원문 줄 65~100ms, 앵커 30ms)이 기존 렌더 비용(약 95ms)만큼 들어 입력 지연이 두 배가 됐기 때문이다. 대부분의 입력은 화면 맨 위보다 아래쪽을 고치므로 그사이 어긋남은 거의 없다.
- 재렌더 뒤 다시 맞추기 전까지 기준이 아닌 쪽의 스크롤 이벤트는 무시한다. 브라우저 스크롤 앵커링이나 높이 변화로 생긴 스크롤을 사용자 스크롤로 보고 기준을 바꾸면 원문이 튄다. 미리보기에는 `overflow-anchor: none`도 준다. 다시 맞출 위치는 동기화가 정하므로 앵커링이 먼저 움직여 한 프레임 튀는 것을 막는다. Safari는 앵커링이 없어 이 속성을 무시하며, 결과는 같다.
- `atEnd`가 참이면 restore가 그 쪽을 `scrollHeight`로 보낸다.

### D7. 미리보기 글자 선택 중에는 미리보기에서 전파하지 않는다

- 미리보기의 `pointerdown`이 스크롤바가 아닌 내용 위에서 일어나면(`event.offsetX < preview.clientWidth`) 포인터를 놓을 때까지 미리보기 → 원문 전파를 멈춘다. 드래그 선택으로 생기는 자동 스크롤은 원문을 움직이지 않는다. 포인터를 놓은 뒤 다시 맞추지는 않는다. 다음 사용자 스크롤에서 맞춰진다.
- 링크를 누르면 새 탭이 열릴 뿐 스크롤이 생기지 않으므로 이 규칙만으로 충분하다.

### D8. 모듈과 연결

- `src/lib/scroll-sync/map.ts`: D4의 순수 함수.
- `src/lib/scroll-sync/measure.ts`: mirror로 `lineTops` 재기(D3), 미리보기 앵커 재기(D4). DOM만 읽는다.
- `src/lib/scroll-sync/scroll-sync.ts`: `ScrollSync` 클래스. 생성자 `new ScrollSync(source, preview)`가 이벤트와 `ResizeObserver`를 걸고 `destroy()`로 푼다. `capture()`, `reset()`, `contentChanged()`를 연다.
- `EditorPane.svelte`: 미리보기에 `bind:this`를 더하고, 두 요소가 생기면 `ScrollSync`를 만든다. `$effect`로 `note.html`, `note.id` 변경을 넘긴다. 탭 `onclick`에서 `capture()`를 부른다.
- 이 구조는 `markdown/format.ts`(순수) + `markdown/apply-edit.ts`(DOM 접점)로 나눈 선례를 따른다.

## Risks / Trade-offs

- [mirror와 textarea의 줄바꿈 불일치] → 스타일을 computed style에서 복사하고, 폭은 스크롤바를 뺀 `clientWidth`를 쓴다. 한글, 영문 긴 단어, 공백 없는 긴 URL, 탭 문자가 섞인 노트로 세 브라우저에서 확인한다(tasks 2.2).
- [긴 노트에서 측정 비용] → 측정은 내용이나 폭이 바뀐 뒤 처음 동기화할 때 한 번만 한다. 입력 중에는 다시 맞추기를 입력이 멈춘 뒤로 미뤄 키 입력마다 재지 않는다(D6). 스크롤 중에는 측정값을 다시 쓴다. 더 줄여야 하면 원문 쪽은 바뀐 줄 이후만 다시 잰다.
- [블록 안쪽의 어긋남] → 긴 코드 블록이나 큰 표 안에서는 비례 보간이라 몇 줄 어긋날 수 있다. 범위 제외로 받아들인다.
- [기준 쪽 판정 누락] → 놓친 입력이 있어도 D5의 기대값 비교가 그 쪽을 기준으로 바꿔 준다. 최악의 경우 한 프레임 늦게 따라온다.
- [DOMPurify 설정 변경으로 앵커가 사라짐] → 비율 매핑으로 떨어질 뿐 오류는 없다. 주석과 tasks 확인으로 막는다.

## Open Questions

없음. 탐색에서 확정한 결정(양방향, 스크롤만 따라가기, 좁은 화면 탭 전환 시 위치 잇기, 토글 없음)을 그대로 따른다.
