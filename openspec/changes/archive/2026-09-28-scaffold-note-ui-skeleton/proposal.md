## Why

프로젝트는 Vite + Svelte 5 초기 템플릿과 채택된 DESIGN.md만 있는 상태라, 실제 기능을 붙이기 전에 화면 구조·반응형 동작·상태 문구가 디자인 계약대로 성립하는지 확인할 수단이 없다. 기능 없이 목업 데이터로 전체 UI 뼈대를 먼저 세워 레이아웃과 컴포넌트 상태를 검증하고, 이후 기능 구현이 채워 넣을 자리를 확정한다.

## What Changes

- DESIGN.md의 3단 레이아웃(사이드바 · 노트 목록 · 에디터+미리보기)을 목업 데이터로 렌더링하는 메인 화면 추가
- 좁은 화면 대응: 사이드바 오버레이, 목록 ↔ 노트 상세 단일 컬럼 전환, 편집/미리보기 탭 전환
- DESIGN.md가 문구로 명시하도록 요구하는 상태 변형 표시: 노트 미선택, 빈 폴더, 검색 결과 없음, 저장 상태 3종(저장됨 / 저장 중 / 저장 안 됨)
- 삭제 확인 다이얼로그(열기/닫기만, 실제 삭제 없음)
- 기능 트리거가 없는 상태(검색 결과 없음, 저장 상태 변형)를 URL 쿼리로 강제 표시하는 개발용 장치
- DESIGN.md §4의 컴포넌트 7종(primary-button, note-card, sidebar-nav-item, tag-chip, search-input, save-status-indicator, markdown-toolbar-button)을 default/hover/focus-visible 및 명시된 상태까지 구현
- Vite 초기 템플릿 잔여물(Counter 예제, 기본 에셋) 제거

동작 경계: 노트 선택, 사이드바/다이얼로그 열기·닫기, 탭 전환 같은 **UI 표시 상태만** 동작한다. 저장, 검색 필터링, 태그/폴더 필터링, 마크다운 파싱, 노트 추가·편집·삭제, 상대 시간 계산 등 **데이터를 다루는 기능은 일절 구현하지 않는다**.

범위 제외: 키보드 단축키 및 안내, 설정 화면, 영속 저장, 라우팅.

## Capabilities

### New Capabilities
- `note-ui-skeleton`: 목업 데이터 기반 노트 앱 UI 뼈대 — 반응형 3단 레이아웃, UI 표시 상태 전환, 상태 변형 문구, 삭제 확인 다이얼로그, 개발용 강제 상태 쿼리

### Modified Capabilities
(없음)

## Impact

- 코드: `src/App.svelte`, `src/app.css` 재작성, `src/lib/` 하위에 레이아웃·컴포넌트·목업 데이터·UI 상태 모듈 신설, `src/lib/Counter.svelte`, `src/assets/*`, `public/icons.svg` 템플릿 파일 제거
- 의존성: 추가 없음 (마크다운 파서, 아이콘 라이브러리, CSS 프레임워크 미도입)
- 디자인 계약: DESIGN.md는 수정하지 않는다. DESIGN.md에 수치가 없는 브레이크포인트는 이 변경의 design.md에 기록한다
