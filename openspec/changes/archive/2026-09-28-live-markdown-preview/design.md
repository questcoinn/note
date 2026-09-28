## Context

- 동기와 범위는 proposal.md, 관찰 가능한 동작은 `specs/markdown-preview/spec.md`와 `specs/note-ui-skeleton/spec.md` 참고.
- 뼈대 설계(`archive/2026-09-28-scaffold-note-ui-skeleton/design.md`)가 이미 예고한 전환을 실행한다. D3은 "데이터 import를 스토어로 바꾸면 된다"고 했고, D5는 "사용자 입력을 `{@html}`에 넣으려면 sanitize가 필요하다"고 했다.
- 현재 노트 데이터(`mock/data.ts`의 `notes`)는 `EditorPane`, `NoteList`, `NoteCard`(타입), `Sidebar`(개수)가 직접 import한다. 원문 textarea는 `{#key}`로 다시 그리는 비제어 입력이다.
- 런타임 의존성은 아직 하나도 없다. SSR이 없는 순수 브라우저 앱이라 DOM API를 바로 쓸 수 있다.
- `forced.save`는 쿼리가 없으면 `'saved'`로 채워져서, 강제된 값인지 기본값인지 구분할 수 없다.

## Goals / Non-Goals

**Goals:**
- 원문을 한 번만 파싱해 미리보기 HTML, 제목, 미리보기 문장을 모두 얻는다.
- 편집한 노트만 다시 계산한다. 다른 노트의 파생값은 캐시된 값을 그대로 쓴다.
- 마크다운 렌더링과 정화를 한 모듈에 모아, 나중에 스크롤 싱크나 하이라이팅을 붙일 지점을 하나로 둔다.

**Non-Goals:**
- 입력 디바운스, 가상화, Web Worker 파싱. 노트 크기(수 KB)에서는 필요 없다.
- 렌더 결과를 DOM diff로 부분 갱신하기.
- 원문-미리보기 스크롤 싱크를 위한 `data-line` 속성 출력. markdown-it의 `token.map`으로 나중에 붙일 수 있다는 점만 확인하고, 이번에는 출력하지 않는다.

## Decisions

### D1. 파일 구조

```
src/lib/
  mock/data.ts              NoteSeed[] (id, folderId, tagIds, updatedLabel, source)
                            previewHtml, snippet, title 필드 삭제
  notes.svelte.ts           NoteDoc 클래스 + notes 배열 + noteById  (신규)
  markdown/render.ts        markdown-it 인스턴스, 규칙, 정화, 텍스트 추출  (신규)
  ui-state.svelte.ts        forced.save를 SaveStatus | null로 변경
```

`NoteList`, `Sidebar`, `EditorPane`은 `mock/data`의 `notes` 대신 `notes.svelte`의 `notes`를 import한다. `NoteCard`의 prop 타입은 `NoteDoc`이 된다. 폴더와 태그는 계속 `mock/data`의 상수다.

### D2. 노트는 필드별 `$state`/`$derived`를 가진 클래스

```ts
class NoteDoc {
  readonly id; readonly folderId; readonly tagIds; readonly updatedLabel
  source = $state('')
  dirty  = $state(false)
  #tokens = $derived(parse(this.source))       // 한 번만 파싱
  // 미리보기 문장은 제목으로 쓴 줄을 빼야 하므로 제목과 함께 한 번에 추출한다 (D7)
  #titleAndSnippet = $derived(extractTitleAndSnippet(this.#tokens))
  html    = $derived(renderHtml(this.#tokens))  // 정화까지 끝난 문자열
  title   = $derived(this.#titleAndSnippet.title)
  snippet = $derived(this.#titleAndSnippet.snippet)  // '' 이면 카드에서 숨김
}
export const notes: NoteDoc[] = seeds.map((s) => new NoteDoc(s))
```

- Svelte 5 클래스 필드 `$derived`는 인스턴스별로 지연 계산되고 메모이즈된다. 그래서 노트 A를 편집해도 B~G는 다시 파싱하지 않는다.
- `notes` 배열 자체는 `$state`가 아니다. 이번 변경에서는 노트 추가, 삭제, 정렬이 없어서 배열 구성이 바뀌지 않는다.
- 대안: 전역 `$state` 배열에 순수 객체를 넣고 컴포넌트마다 `$derived`로 계산하는 방식. 목록 카드와 에디터가 같은 노트를 두 번 파싱하게 되어 기각했다.
- 대안: 스토어 라이브러리 도입. 뼈대 설계 D3의 "상태 관리 라이브러리 없음" 원칙과 맞지 않아 기각했다.

### D3. 에디터 바인딩과 dirty 플래그

- `<textarea bind:value={note.source} oninput={() => (note.dirty = true)}>`로 바꾸고 `{#key note.id}`를 없앤다. 노트가 바뀌면 바인딩 대상이 바뀌면서 값이 따라온다.
- `dirty`는 한 번 true가 되면 이번 세션 동안 되돌아가지 않는다. 원문을 원래대로 되돌려도 "저장 안 됨"을 유지한다. 저장되지 않았다는 사실은 그대로이기 때문이다.
- 표시 상태: `forced.save ?? (note.dirty ? 'unsaved' : 'saved')`. 이를 위해 `readForced()`는 쿼리가 없으면 `null`을 돌려준다.
- `SaveStatusIndicator`의 `role="status"` 덕분에 첫 입력 때 "저장 안 됨"이 한 번 낭독된다. 그 뒤로는 문구가 바뀌지 않아 반복 낭독이 없다.

### D4. markdown-it 설정

```ts
const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false })
```

- `html: false`: 원문 HTML을 이스케이프한다(스펙 "HTML 태그는 글자로 보임").
- `linkify: true`: URL 자동 링크. linkify-it은 markdown-it의 의존성으로 함께 설치된다.
- 표와 취소선은 markdown-it의 기본 규칙이라 켤 필요가 없다.
- `breaks: false`: CommonMark 기본 동작이다. 문단 안의 한 줄 줄바꿈은 공백이 된다(Risks 참고).
- `validateLink` 기본값이 `javascript:`, `vbscript:`, `file:`, 이미지가 아닌 `data:` URL을 링크로 만들지 않는다. D6의 정화가 한 번 더 막는다.
- 대안: marked. 더 가볍지만(약 12KB 대 35KB gz), 사용자가 markdown-it을 선택했다. 토큰 스트림과 `token.map` 덕분에 텍스트 추출(D7)과 나중의 스크롤 싱크가 쉬워진다.

### D5. 렌더러 재정의와 체크박스 규칙

| 대상 | 방식 | 출력 |
|---|---|---|
| 이미지 | `renderer.rules.image` | `<span class="image-alt">이미지: {alt}</span>`. alt가 비면 `이미지`. `<img>`는 절대 만들지 않는다 |
| 표 | `renderer.rules.table_open` / `table_close` | `<div class="table-scroll"><table>` … `</table></div>`. 표에 `display:block`을 쓰면 Safari가 표 의미를 잃기 때문에 감싸는 방식을 쓴다 |
| 체크박스 | core 규칙 `task-list` (`inline` 뒤) | `list_item_open` 바로 안의 첫 inline 내용이 `[ ] ` / `[x] ` / `[X] `로 시작하면 그 접두사를 지우고 `<input type="checkbox" disabled [checked] aria-label="{항목 텍스트}">` html_inline 토큰을 앞에 넣는다. 해당 `li`에 `class="task"`를 붙인다 |

- 체크박스 규칙은 약 20줄로 직접 작성한다. `markdown-it-task-lists`는 오래 관리되지 않았고, 우리는 보기 전용과 접근성 이름만 필요하다.
- `html: false`여도 규칙이 직접 만든 `html_inline` 토큰은 그대로 출력된다. 이 옵션은 파싱 단계에만 적용되기 때문이다. 이 토큰에 넣는 항목 텍스트는 `md.utils.escapeHtml`로 이스케이프한다.
- `disabled`이므로 클릭도 포커스도 되지 않는다(스펙 "체크박스는 보기 전용").

### D6. DOMPurify로 최종 정화, 링크 속성은 훅에서

```ts
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer') }
})
const clean = DOMPurify.sanitize(html, { FORBID_TAGS: ['img', 'style', 'form'], FORBID_ATTR: ['style'] })
```

- DOMPurify는 기본 설정에서 `target` 속성을 지우기 때문에, 링크 속성은 markdown-it 렌더러가 아니라 정화가 끝난 뒤 훅에서 붙인다.
- `img`를 금지 목록에 넣어, D5의 이미지 렌더러가 실수로 바뀌어도 외부 요청이 생기지 않게 한다.
- 훅은 전역이므로 `render.ts` 모듈 로드 시 한 번만 등록한다. 이 앱에는 다른 DOMPurify 사용처가 없다.
- 대안: 정화 없이 `html: false`만 믿기. 렌더러 재정의와 직접 만든 html_inline 토큰이 늘수록 실수 여지가 커지므로 기각했다.

### D7. 제목과 미리보기 문장 추출 (토큰 기반)

규칙 자체는 스펙 "제목과 미리보기 문장 파생"에 있다. 여기서는 토큰으로 구현하는 방법만 적는다.

1. **블록 수집:** 토큰을 한 번 훑어 원문 순서대로 블록 목록을 만든다.
   - `heading_open` + 다음 inline → `{ kind: 'heading', tag, lines }`
   - `paragraph_open` + 다음 inline → `{ kind: 'text', lines }`. 목록 항목과 인용 안의 문단도 markdown-it에서는 `paragraph_open`이라 따로 처리할 필요가 없다. tight 목록의 숨은 문단도 포함된다.
   - `fence`, `code_block` → `{ kind: 'code', lines: content.split('\n') }`
2. **줄 단위 평문화:** inline 토큰의 `children`을 `softbreak`/`hardbreak`에서 끊어 줄 배열로 만든다. 각 줄은 `text`와 `code_inline`의 `content`만 이어 붙이고, 서식 토큰(`strong_open`, `link_open` 등)은 무시한다. `image`는 alt 텍스트로 바꾼다. 연속 공백은 하나로 줄이고 앞뒤 공백을 자른 뒤, 빈 줄은 버린다. 체크박스 접두사는 D5의 core 규칙이 이미 지웠으므로 따로 처리하지 않는다.
3. **제목:** `tag === 'h1'`인 첫 heading 블록이 있으면 그 줄들을 공백으로 이은 값이다. 이때 제목 위치는 "그 블록 전체"다. 없으면 줄이 있는 첫 블록의 `lines[0]`이고, 제목 위치는 `(그 블록, 0번 줄)`이다. 둘 다 없으면 `제목 없음`이다.
4. **미리보기 문장:** `kind === 'text'`인 블록을 순서대로 본다. heading과 code 블록은 건너뛴다. 제목 위치와 같은 블록이면 0번 줄을 뺀 나머지 줄만 쓴다. 남는 줄이 있는 첫 블록에서 줄들을 공백으로 이은 값이 미리보기 문장이다. 없으면 `''`이다.
5. `#tokens`를 공유하므로 추가 파싱은 없다. 길이 자르기는 하지 않고 카드의 기존 2줄 line-clamp에 맡긴다.

- 목업 원문 7개는 모두 `# 제목`으로 시작하므로 제목은 지금과 같게 나온다. 미리보기 문장은 기존의 손으로 쓴 값과 조금 다를 수 있다. 예를 들어 n2는 첫 문단만 남는다. 이는 의도된 변화다.
- 대안: 원문 문자열을 정규식으로 줄 단위 처리. 코드 블록 안의 `# `, 들여쓴 목록, 이스케이프 같은 경우를 파서와 다르게 해석하게 되어 기각했다.

### D8. 미리보기 스타일 추가

기존 `.preview :global(...)` 규칙에 다음을 더한다. 새 토큰은 만들지 않는다.

| 요소 | 스타일 |
|---|---|
| `strong` | `font-weight: 700`, `color: var(--color-foreground)` |
| `em` | 기본 기울임 유지 |
| `s`, `del` | `--color-body`와 취소선. 흐리게 보이려고 muted를 쓰지 않는다. 본문이므로 4.5:1을 유지해야 한다. markdown-it의 `~~ ~~`는 `<s>`로 출력되고, `del`은 같은 의미의 태그라 함께 지정한다 |
| `h5`, `h6` | DESIGN.md에 역할이 없어 기존 역할을 재사용한다. h5는 body 크기와 줄높이에 굵기 600, h6은 body-small 크기와 줄높이에 굵기 600, 둘 다 `--color-foreground` |
| `hr` | `border: 0; border-top: 1px solid var(--color-border)` |
| `.table-scroll` | `overflow-x: auto` |
| `table`, `th`, `td` | `border-collapse: collapse`, 셀 경계는 `--color-border`, 패딩은 `--spacing-md` `--spacing-lg`, `th`는 `--color-surface` 배경에 굵기 600, 글자 크기는 body-small |
| `li.task` | `list-style: none`, 체크박스와 텍스트 사이 `--spacing-md`, `accent-color: var(--color-primary)` |
| `.image-alt` | `display: inline-block`, `--color-surface` 배경, `--radius-sm`, body-small, `--color-body` |

## Risks / Trade-offs

- [`breaks: false`라서 한 줄만 바꾼 내용이 미리보기에서 이어 붙음. 일부 노트 앱 사용자에게는 낯설 수 있음] → CommonMark 표준을 따르고 목업은 문단을 빈 줄로 나눈다. 사용해 본 뒤 불편하면 옵션 하나만 바꾸면 되고, 그때 스펙의 지원 문법 요구사항도 함께 고친다.
- [키 입력마다 `{@html}`이 미리보기 DOM 전체를 교체해 선택 영역이 풀리고, 문서 길이가 크게 줄면 스크롤이 튈 수 있음] → 미리보기는 읽기 전용이라 선택 영역을 유지할 이유가 적다. 스크롤 위치는 컨테이너가 유지한다. 문제가 되면 스크롤 싱크 변경에서 함께 다룬다.
- [첫 런타임 의존성 두 개로 번들이 약 45KB gz 늘어남] → 이 앱의 핵심 기능에 드는 비용이다. 코드 분할은 하지 않는다. 첫 화면부터 미리보기가 필요하기 때문이다.
- [DOMPurify 전역 훅이 나중에 다른 정화 용도와 충돌] → 훅 등록을 `render.ts` 한 곳에 두고 주석으로 명시한다. 다른 용도가 생기면 `DOMPurify(window)`로 별도 인스턴스를 만든다.
- [`dirty`가 되돌아가지 않아, 원문을 원래대로 돌려도 "저장 안 됨"으로 남음] → 저장되지 않았다는 사실에는 맞다. 영속화 변경([3])에서 저장 성공 시 false로 바꾼다.
- [DESIGN.md에 h5/h6, 표 스타일 규칙이 없음] → 기존 역할과 토큰만 재사용했다. 사용 후 확정되면 omd 흐름으로 DESIGN.md에 반영할지 판단한다.

## Migration Plan

로컬 목업 앱이라 배포나 롤백 절차는 없다. 목업의 `previewHtml`, `snippet`, `title` 필드 삭제는 D1의 참조처를 모두 바꾸는 한 번의 변경으로 끝낸다. `pnpm check`가 남은 참조를 잡아낸다.
