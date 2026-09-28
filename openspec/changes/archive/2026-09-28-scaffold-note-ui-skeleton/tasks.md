## 1. 정리와 기반

- [x] 1.1 `src/lib/Counter.svelte`, `src/assets/*`, `public/icons.svg`를 삭제하고 남은 참조가 없음을 `pnpm check` 통과로 확인
- [x] 1.2 `index.html`의 `lang`을 `ko`, 제목을 "노트"로 바꾸고 브라우저 탭 제목으로 확인
- [x] 1.3 `src/app.css`에 DESIGN.md 토큰 전체를 CSS 변수로 옮기고(D2) reset, 기본 폰트/본문 타이포, reduced-motion 덮어쓰기를 추가 — DESIGN.md §2·§3 토큰 목록과 변수 목록을 대조해 누락 0개 확인
- [x] 1.4 `src/lib/mock/data.ts`에 D4 타입과 폴더 3개(1개 비어 있음), 태그 4~5개, 노트 6~8개 작성 — 노트 원문에 제목·목록·링크·인라인 코드·코드 블록·인용이 모두 한 번 이상 등장하고 `count`가 실제 노트 수와 일치하는지 확인
- [x] 1.5 `src/lib/ui-state.svelte.ts`에 D3 UI 상태와 D6 강제 상태 파싱 작성 — `pnpm check` 통과로 확인
- [x] 1.6 `Icon.svelte`에 D9 아이콘 세트 작성 — 임시로 전체 아이콘을 렌더해 모두 보이는지 확인 후 임시 코드 제거

## 2. 컴포넌트

- [x] 2.1 `PrimaryButton` (fill-primary, fill-danger / default·hover·focus-visible·pressed·disabled, 56px 높이, `--radius-button-xl`) — 각 상태를 브라우저에서 눈으로 확인
- [x] 2.2 `TagChip` (fill, weak / hover·focus-visible·selected, 배경색만으로 상태 표현) — 테두리·그림자 없음 확인
- [x] 2.3 `NoteCard` (제목, 미리보기, 수정 시각, 태그 칩 / hover·focus-visible·selected, 버튼 시맨틱으로 Enter 활성화) — 키보드로 선택되는지 확인
- [x] 2.4 `SidebarNavItem` (folder, tag, all-notes / 아이콘·라벨·개수, active는 `aria-current`) — 스크린 리더 트리에서 현재 항목 표시 확인
- [x] 2.5 `SearchInput` (선행 아이콘, 입력, 값이 있을 때만 지우기 버튼, 필터링 없음) — 입력해도 목록이 그대로인지 확인
- [x] 2.6 `SaveStatusIndicator` (saved·saving·unsaved, 아이콘+문구, 비인터랙티브) — `?save=` 세 값으로 문구와 색 확인
- [x] 2.7 `MarkdownToolbarButton` (6종, 아이콘 전용 + 한국어 `aria-label`, 클릭해도 원문 변화 없음) — 접근성 이름 확인
- [x] 2.8 `EmptyState` (아이콘, 제목 문구, 설명, 선택적 행동 버튼) 작성 — 2.9 이후 레이아웃에서 세 가지 빈 상태에 재사용되는지 확인
- [x] 2.9 `ConfirmDialog` (네이티브 `<dialog>` showModal, 결과 먼저 말하는 문구, 삭제·취소 모두 닫기만) — Esc 닫기와 포커스 가두기 확인

## 3. 레이아웃

- [x] 3.1 `Sidebar` — 새 노트 버튼, 전체 노트, 폴더·태그 그룹, `< 1024px`에서 오버레이(D8) — 900px에서 열기/바깥 클릭/Esc 닫기, 닫힌 뒤 토글 버튼 포커스 복귀 확인
- [x] 3.2 `NoteList` — 헤더(현재 범위 이름, 좁은 폭 메뉴 토글), 검색, 카드 목록, 빈 폴더(`?folder=empty`)와 결과 없음(`?search=empty`) 빈 상태 — 두 쿼리로 각각 확인
- [x] 3.3 `EditorPane` — 미선택 빈 상태, 상단 바(좁은 폭 뒤로 가기, 저장 상태, 툴바, 삭제), 원문(모노) / 미리보기(`{@html}`, sanitize 필요 주석) 2단, `< 1024px` 탭 전환 — 1280px 2단, 900px 탭 전환 확인
- [x] 3.4 `App.svelte`에서 D7 브레이크포인트 그리드로 3단 조립, `< 768px`에서 선택 여부로 목록 ↔ 상세 전환 — 375px에서 카드 → 상세 → 뒤로 가기 흐름 확인

## 4. 검증

- [x] 4.1 `pnpm check`와 `pnpm build`가 경고/오류 없이 통과
- [x] 4.2 1280 / 900 / 375 / 320px에서 spec의 모든 시나리오를 브라우저로 한 번씩 확인, 320px과 200% 확대에서 가로 스크롤 없음 확인
- [x] 4.3 Tab 키 순회로 전체 인터랙티브 요소의 focus-visible과 순서(사이드바 → 목록 → 에디터) 확인
- [x] 4.4 동작 줄이기 설정(DevTools 에뮬레이션)에서 오버레이·hover 전환이 즉시 일어나는지 확인
- [x] 4.5 `rg '#[0-9a-fA-F]{3,6}' src/lib`로 컴포넌트에 원시 색상값이 없고, 모든 UI 카피가 DESIGN.md 용어표(노트, 폴더, 태그, 검색, 저장, 미리보기, 저장 안 됨)를 따르는지 확인
- [x] 4.6 DevTools 네트워크/Application 탭에서 목업 관련 요청·저장소 쓰기가 없음을 확인
