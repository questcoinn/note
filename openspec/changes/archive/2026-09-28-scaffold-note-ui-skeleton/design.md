## Context

- 스택: Vite 8 + Svelte 5 (SvelteKit 아님, 라우터 없음), TypeScript. 런타임 의존성 없음.
- `src/App.svelte`는 한 줄짜리 자리 표시자, `src/app.css`는 비어 있다.
- 디자인 계약은 채택된 DESIGN.md(Core v2)다. 토큰, 컴포넌트 7종과 상태, 3단 레이아웃, 한국어 카피 규칙이 여기서 정해진다. 이 설계는 DESIGN.md를 바꾸지 않고 따르기만 한다.
- 동기와 범위는 proposal.md, 관찰 가능한 동작은 `specs/note-ui-skeleton/spec.md` 참고.

## Goals / Non-Goals

**Goals:**
- 나중에 실제 기능을 붙일 때 컴포넌트 경계와 데이터 모양을 바꾸지 않고 목업 소스만 교체할 수 있는 구조
- DESIGN.md 토큰을 단일 지점(CSS 변수)에 두어 컴포넌트가 원시값을 직접 쓰지 않게 함

**Non-Goals:**
- 상태 관리 라이브러리, 라우터, 테스트 러너 도입
- 컴포넌트 카탈로그(Storybook 등)나 dev 패널
- 다크 모드 (DESIGN.md에 정의 없음)

## Decisions

### D1. 파일 구조

```
src/
  app.css                    토큰(CSS 변수), reset, 기본 타이포, reduced-motion
  App.svelte                 레이아웃 셸 조립만
  lib/
    mock/data.ts             Folder[], Tag[], Note[] 정적 배열
    ui-state.svelte.ts       UI 표시 상태 + URL 강제 상태 (runes)
    layout/
      Sidebar.svelte
      NoteList.svelte
      EditorPane.svelte
    components/
      PrimaryButton.svelte   NoteCard.svelte        SidebarNavItem.svelte
      TagChip.svelte         SearchInput.svelte     SaveStatusIndicator.svelte
      MarkdownToolbarButton.svelte  ConfirmDialog.svelte  EmptyState.svelte
      Icon.svelte
```

컴포넌트 파일은 DESIGN.md §4의 컴포넌트 id와 1:1로 대응한다. ConfirmDialog, EmptyState, Icon은 DESIGN.md에 컴포넌트 정의가 없는 조립용 조각이므로 기존 토큰만 사용하고 새 시각 규칙을 만들지 않는다.

### D2. 토큰은 `app.css`의 CSS 사용자 정의 속성

DESIGN.md 토큰 이름을 점 → 하이픈으로 옮긴다: `color.primary` → `--color-primary`, `radius.button-xl` → `--radius-button-xl`, 타입 역할은 `--type-h1-size` 등으로 둔다. 컴포넌트 `<style>`은 이 변수만 참조한다.
- 대안: Tailwind — 의존성이 늘고 토큰 이름이 달라져 계약 추적이 어려워서 기각.
- 대안: TS 상수 객체 — 스타일에서 쓰려면 인라인 style이 필요해 기각.

`@media (prefers-reduced-motion: reduce)`에서 `--motion-duration-fast: 0ms`로 덮어쓴다. 모든 transition은 이 변수를 쓴다.

### D3. UI 상태는 모듈 단위 `$state` 하나

`ui-state.svelte.ts`가 다음만 가진다: `selectedNoteId`, `sidebarOpen`, `editorTab: 'edit' | 'preview'`, `deleteDialogOpen`, 그리고 URL에서 한 번 읽는 `forced`(`search`, `save`, `folder`). 컴포넌트는 이 모듈을 import해 읽고 쓴다.
- 대안: Context API / props drilling — 뼈대 규모에서 이득 없이 코드만 늘어나 기각.
- 데이터(노트 배열)는 상태가 아니라 import된 상수다. 기능 단계에서 이 import를 스토어로 바꾸면 된다.

### D4. 목업 데이터 모양

```ts
type Folder = { id: string; name: string; count: number }
type Tag    = { id: string; name: string; count: number }
type Note = {
  id: string; title: string; folderId: string; tagIds: string[]
  snippet: string        // 목록 미리보기 문장
  updatedLabel: string   // "3분 전" — 날짜 계산 없이 표시 문자열
  source: string         // 에디터에 보일 마크다운 원문
  previewHtml: string    // 손으로 작성한 렌더 결과
}
```

`count`, `snippet`, `updatedLabel`을 파생하지 않고 직접 적는 이유: 파생 계산도 기능이라 뼈대에서 빼고, 표시 결과를 데이터에서 바로 확인할 수 있게 하기 위함. 목업 노트 원문에는 제목, 목록, 링크, 인라인 코드, 코드 블록, 인용이 골고루 들어가 미리보기 타이포를 검증할 수 있게 한다.

### D5. 미리보기는 `{@html previewHtml}`

마크다운 파서를 넣지 않는다. `previewHtml`은 저장소에 커밋된 신뢰된 정적 문자열이므로 XSS 위험이 없다. 미리보기 컨테이너에 `h1~h4, p, ul, ol, code, pre, blockquote, a`에 대한 타입 역할 스타일을 적용한다.
- 위험: 기능 단계에서 사용자 입력을 그대로 `{@html}`에 넣으면 XSS — 이 지점에 sanitize가 필요하다는 주석을 남긴다.

### D6. 강제 상태는 URL 쿼리, 로드 시 한 번만 읽음

| 쿼리 | 효과 |
|---|---|
| `?search=empty` | 검색 입력에 예시 검색어, 목록은 결과 없음 상태 |
| `?save=saving` / `?save=unsaved` | 저장 상태 변형 (기본 saved) |
| `?folder=empty` | 빈 목업 폴더를 active로, 목록은 빈 폴더 상태 |

여러 쿼리를 함께 쓸 수 있고, `search`가 `folder`보다 우선한다. 폴더 클릭으로 빈 폴더를 여는 방식은 목록 필터링(=기능)이 되므로 쿼리로만 보여준다.
- 대안: 화면 내 dev 패널 — 그 자체가 유지할 UI가 되어 기각.

### D7. 브레이크포인트

DESIGN.md에 수치가 없어 이 변경에서 결정한다.

| 폭 | 사이드바 | 목록 | 에디터 |
|---|---|---|---|
| ≥ 1024px | 고정 열 | 고정 열 | 원문/미리보기 좌우 2단 |
| 768–1023px | 오버레이 (토글) | 고정 열 | 편집/미리보기 탭 |
| < 768px | 오버레이 (토글) | 목록 ↔ 상세 중 하나만 전체 폭 | 편집/미리보기 탭 |

좁은 폭의 목록 ↔ 상세 전환은 `selectedNoteId` 유무로 결정한다(뒤로 가기 = 선택 해제). 브라우저 히스토리는 건드리지 않는다. CSS media query로 레이아웃을 바꾸고, 탭 UI는 `< 1024px`에서만 보이게 한다. 200% 확대는 폭이 절반이 되는 것과 같으므로 같은 규칙으로 처리된다.

### D8. 오버레이와 다이얼로그

- 삭제 확인: 네이티브 `<dialog>`의 `showModal()` — 포커스 가두기, Esc 닫기, backdrop을 브라우저가 처리한다.
- 사이드바 오버레이: 같은 사이드바 마크업을 CSS로 오버레이 위치로 옮긴다. 열린 동안 바깥 영역 클릭과 Esc로 닫고, 닫히면 토글 버튼으로 포커스를 돌린다. DESIGN.md 규칙대로 그림자 없이 불투명 `--color-canvas` 배경을 쓰고, 뒤 본문은 반투명 scrim으로 가린다.
- 대안: 사이드바에도 `<dialog>` — 넓은 화면에서 일반 열로 보여야 해서 요소를 둘로 나눠야 하므로 기각.

### D9. 아이콘

`Icon.svelte`가 이름 → 인라인 SVG path를 매핑한다(plus, folder, hash, search, x, menu, arrow-left, bold, italic, heading, link, list, code, trash, check, loader, alert). 24px 그리드, `stroke="currentColor"`. 장식 아이콘은 `aria-hidden`, 아이콘 전용 버튼은 버튼에 `aria-label`. 이모지는 쓰지 않는다. `public/icons.svg`(Vite 템플릿)는 쓰지 않고 삭제한다.

## Risks / Trade-offs

- [원문을 편집해도 미리보기가 안 바뀌어 사용자가 버그로 오인] → 뼈대 단계 동작임을 spec에 명시. 목업 앱이므로 별도 안내 UI는 두지 않는다.
- [`count`/`snippet`을 손으로 적어 실제 노트 수와 어긋남] → 목업 작성 시 한 번 맞춰 두고, 기능 단계에서 파생값으로 교체한다.
- [URL 강제 상태 코드가 기능 단계까지 남음] → `ui-state.svelte.ts`의 `forced` 한 곳에만 두어 제거를 쉽게 한다.
- [브레이크포인트가 DESIGN.md 밖에 있음] → 구현 후 사용해 보고 확정되면 omd 흐름으로 DESIGN.md Layout에 반영한다.
