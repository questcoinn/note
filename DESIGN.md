# Note — 마크다운 노트 앱 디자인 시스템 Design System

<!-- design-md:section experience -->
## 1. Experience

<!-- design-md:claim scope kind=product-surface lang=en -->
### Scope

토스의 절제된 시각 언어와 담백한 한국어 카피를 노트 작성 흐름에 맞게 재구성한다. 사용자가 생각을 적고 다시 찾는 과정에서 화면이 방해가 되지 않도록, 넓은 여백과 단일한 파란 액센트, 명확한 타이포 위계로 정보 밀도를 낮춘다.
<!-- design-md:claim-end -->

<!-- design-md:claim primary-tasks kind=user-outcomes count=5 lang=en -->
### Primary tasks

- 새 노트 작성 및 실시간 마크다운 프리뷰

- 노트 목록에서 최근/전체 노트 훑어보기

- 태그와 폴더로 노트 분류 및 탐색

- 검색으로 특정 노트 즉시 찾기

- 노트 상세 보기 및 편집 전환
<!-- design-md:claim-end -->

### Design direction

- 군더더기 없는 그레이스케일 배경 위에 단일 액센트 블루만 기능적으로 사용

- 넓은 여백과 명확한 타이포 대비로 정보 위계를 세운다

- 마크다운 원문과 프리뷰가 대등하게 공존하는 절제된 2단 레이아웃

- 상태 전환(저장됨, 편집 중, 검색 결과 없음)은 문구로 명시하고 장식적 애니메이션에 의존하지 않는다

### Principles

- 기능적 블루 — 강조색은 실제로 누를 수 있는 행동에만 쓰고 장식에는 쓰지 않는다

- 있는 그대로 답한다 — 저장 상태, 검색 결과, 빈 폴더 등 현재 상태를 모호하지 않게 문구로 보여준다

- 읽기 우선 — 노트를 쓰는 도구지만 다시 읽는 경험이 더 잦다는 전제로 본문 타이포와 여백을 설계한다

- 표면을 구분한다 — 목록/에디터/프리뷰처럼 역할이 다른 표면은 배경과 여백으로만 구분하고 불필요한 카드 테두리나 그림자를 더하지 않는다

### Avoid

- 설명 없는 장식용 그라디언트나 그림자

- 기능 없는 배지·태그의 클릭 유도

- 저장/삭제 등 되돌리기 어려운 동작에 모호한 문구 사용

- 토스 로고 블루(#0064ff)를 UI 인터랙션 블루(#3182f6) 대신 사용하는 것

<!-- design-md:section foundations -->
## 2. Foundations

<!-- design-md:claim foundations kind=rules-or-constraints lang=en -->
### Semantic tokens

- **color.body**: `#4e5968` — 본문 텍스트, 노트 목록 미리보기 텍스트
- **color.border**: `#e5e8eb` — 패널 사이 경계선, 입력창 기본 테두리
- **color.canvas**: `#ffffff` — 전체 배경, 에디터/프리뷰의 기본 캔버스
- **color.danger**: `#e42939` — 삭제 확인, 저장 실패 등 되돌리기 어려운 위험 상태
- **color.foreground**: `#191f28` — 제목과 본문 중 가장 강한 텍스트
- **color.muted**: `#8b95a1` — 타임스탬프, 보조 라벨, placeholder. 흰 배경에서도 대비가 약 3:1로 낮으므로 본문에는 사용하지 않고 비필수 보조 정보에만 사용
- **color.on-primary**: `#ffffff` — primary 배경 위의 텍스트/아이콘
- **color.primary**: `#3182f6` — 인터랙션 블루 — 버튼, 링크, 활성 탭 등 실제 행동에만 사용
- **color.primary-hover**: `#2272eb` — 기본 블루보다 진한 hover/active 상태
- **color.success**: `#0b8f3a` — "저장됨" 같은 완료 상태 표시. 토스 검증 자료에 없는 값으로, 노트 앱의 저장 피드백을 위해 그린필드로 제안됨
- **color.surface**: `#f2f4f6` — 사이드바, 노트 카드 등 캔버스와 구분되는 조용한 배경
- **color.weak-background**: `#e8f3ff` — 선택된 태그/폴더, 검색어 하이라이트 등 약한 강조 배경
- **color.weak-foreground**: `#1b64da` — weak-background와 짝을 이루는 텍스트
- **motion.duration-fast**: `120ms` — 토스 레퍼런스는 모션 토큰을 검증하지 않았으므로, 상태 전환 최소 지속시간을 그린필드로 제안. prefers-reduced-motion에서는 0ms로 대체
- **motion.easing-standard**: `[0.4,0,0.2,1]` — 표준 이징. 그린필드 제안, reduced-motion 시 미사용
- **radius.button-lg**: `14px` — TDS large 버튼 라운드
- **radius.button-md**: `10px` — TDS medium 버튼 라운드
- **radius.button-xl**: `16px` — TDS xlarge 버튼 라운드 — 새 노트 등 1차 행동
- **radius.card**: `12px` — 노트 카드/패널 라운드. 토스 마케팅 라운드(7px)와 TDS 버튼 라운드(16px) 사이에서 노트 앱 카드 표면을 위해 그린필드로 제안됨
- **radius.md**: `6px` — 입력창, 작은 패널 라운드
- **radius.sm**: `4px` — 작은 칩/배지 라운드
- **spacing.lg**: `16px`
- **spacing.md**: `8px`
- **spacing.sm**: `6px`
- **spacing.xl**: `24px`
- **spacing.xs**: `4px`
- **spacing.xxl**: `32px`
- **typography.family.mono**: `ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace` — 마크다운 소스/코드 블록용 그린필드 모노스페이스 스택
- **typography.family.sans**: `-apple-system, "Apple SD Gothic Neo", "Segoe UI", Roboto, sans-serif` — Toss Product Sans의 재배포 라이선스를 확인하지 못해(unresolved) 기본 UI 폰트로 채택하지 않으며, 시스템 산세리프 스택을 기본값으로 사용

### Contrast pairs

- color.foreground on color.canvas: minimum 12:1
- color.body on color.canvas: minimum 4.5:1
- color.on-primary on color.primary: minimum 3:1
- color.weak-foreground on color.weak-background: minimum 4.5:1

### Reduced motion

Required.

### Foundation rules

- 토스 로고 블루(#0064ff)는 브랜드 식별용 메타데이터로만 쓰고, 실제 UI 인터랙션은 항상 primary(#3182f6)를 사용한다

- 본문 텍스트는 최소 WCAG AA 대비 4.5:1, 17px 이상의 굵은 버튼 레이블 같은 큰 텍스트는 3:1을 만족해야 한다

- muted(#8b95a1)는 흰 배경 대비가 약 3:1로 본문 기준을 만족하지 못하므로 타임스탬프·보조 라벨 등 비필수 정보에만 사용한다

- success(#0b8f3a) 같은 그린필드 색상은 명도/채도 축을 primary와 동일한 중성 그레이 스케일 위에서만 사용한다

- prefers-reduced-motion 환경에서는 motion.duration-fast를 0ms로 강제하고 easing은 적용하지 않는다
<!-- design-md:claim-end -->

<!-- design-md:section typography-assets -->
## 3. Typography & Assets

### Type roles

| Role | Usage | Family | Size | Weight | Line height |
|---|---|---|---|---|---|
| h1 | 노트 상세/편집 화면 제목 | typography.family.sans | 36px | 700 | 54px |
| h2 | 섹션 제목(예: 노트 목록 헤더) | typography.family.sans | 30px | 600 | 45px |
| h3 | 노트 카드 제목, 사이드바 폴더/태그 그룹 헤더 | typography.family.sans | 24px | 600 | 36px |
| h4 | 보조 섹션 제목 | typography.family.sans | 22px | 600 | 33px |
| body | 본문, 노트 미리보기 텍스트, 마크다운 프리뷰 기본 문단 | typography.family.sans | 16px | 400 | 24px |
| body-small | 타임스탬프, 보조 라벨, 태그 텍스트 | typography.family.sans | 14px | 400 | 21px |
| code | 마크다운 소스 에디터, 인라인 코드, 코드 블록 — 토스 레퍼런스는 모노스페이스 토큰을 검증하지 않았으므로 그린필드로 제안 | typography.family.mono | 14px | 400 | 22px |

### Assets

| Asset | Kind | Source status | License status | Source | Notes |
|---|---|---|---|---|---|
| system-sans-fallback | font | project-owned | not-required | OS 기본 시스템 폰트 스택 (-apple-system, "Apple SD Gothic Neo", "Segoe UI", Roboto, sans-serif) | typography.family.sans 토큰의 실제 구현체. Toss Product Sans는 재배포 라이선스를 확인할 수 없어 이 프로젝트에서 채택하지 않고, 시스템 산세리프를 기본 UI 폰트로 사용한다 |
| system-mono-fallback | font | project-owned | not-required | OS 기본 모노스페이스 스택 (ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace) | 마크다운 소스/코드 블록용 그린필드 모노스페이스 토큰의 실제 구현체 |

### Rules

- 이 프로젝트는 Toss Product Sans의 공개 재배포 라이선스를 확인할 수 없어 채택하지 않으며, 시스템 산세리프(typography.family.sans)를 기본 UI 폰트로 사용한다

- Tossface는 토스 레퍼런스에서도 선언만 되고 실제 사용은 관측되지 않았으므로 이 프로젝트에서도 채택하지 않는다

- 마크다운 소스 에디터와 코드 블록은 항상 typography.family.mono를 사용한다

<!-- design-md:section components-states -->
## 4. Components & States

### Component: primary-button

**Semantics:** 새 노트 만들기 같은 화면의 1차 행동. TDS Mobile xlarge 버튼 지오메트리(56px 높이, 16px 라운드)를 웹 1차 행동에 적용

- Anatomy: label, optional-leading-icon
- Variants: fill-primary, fill-danger
- States: default, hover, focus-visible, disabled, pressed
- Token references: color.primary, color.on-primary, radius.button-xl

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | applicable |  |
| loading | not-applicable | 새 노트 생성은 즉시 완료되는 로컬 동작이라 로딩 대기 상태가 없음 |
| error | not-applicable | 해당 컴포넌트는 검증 실패 상태를 갖지 않음 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Component: note-card

**Semantics:** 노트 목록의 개별 항목. 클릭하면 해당 노트 상세로 이동하는 인터랙티브 표면

- Anatomy: title, preview-snippet, timestamp, tag-chips
- Variants: default, selected
- States: default, hover, focus-visible, selected
- Token references: color.surface, color.foreground, color.body, color.muted, radius.card

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 노트 카드는 비활성 상태를 갖지 않음 |
| loading | not-applicable | 노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음 |
| error | not-applicable | 해당 컴포넌트는 검증 실패 상태를 갖지 않음 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Component: sidebar-nav-item

**Semantics:** 사이드바의 폴더/태그 탐색 항목

- Anatomy: icon, label, count-badge
- Variants: folder, tag, all-notes
- States: default, hover, focus-visible, active
- Token references: color.body, color.weak-background, color.weak-foreground

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 탐색 항목은 비활성 상태를 갖지 않음 |
| loading | not-applicable | 노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음 |
| error | not-applicable | 해당 컴포넌트는 검증 실패 상태를 갖지 않음 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Component: tag-chip

**Semantics:** 노트에 붙는 태그. 토스 배지는 상태 메타데이터로 클릭 불가지만, 이 프로젝트의 태그는 클릭 시 해당 태그로 필터링되는 탐색 행동을 가지므로 그린필드로 인터랙티브하게 확장함

- Anatomy: label
- Variants: fill, weak
- States: default, hover, focus-visible, selected
- Token references: color.weak-background, color.weak-foreground, radius.sm

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 태그 칩은 비활성 상태를 갖지 않음 |
| loading | not-applicable | 노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음 |
| error | not-applicable | 해당 컴포넌트는 검증 실패 상태를 갖지 않음 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Component: search-input

**Semantics:** TDS Mobile text-field의 box 변형을 웹 검색 입력에 적용. 결과 없음 상태는 문구로 명시

- Anatomy: leading-icon, input-text, clear-button
- Variants: box
- States: default, hover, focus-visible, filled, no-results
- Token references: color.border, color.muted, radius.md

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 검색 입력은 항상 사용 가능하며 비활성 상태를 갖지 않음 |
| loading | not-applicable | 노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음 |
| error | not-applicable | 검색은 유효성 실패가 없고 결과 없음은 별도 empty-state로 표현됨 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Component: save-status-indicator

**Semantics:** 에디터 상단에 "저장됨 / 저장 중 / 저장 안 됨"을 문구와 색으로 함께 표시하는 상태 메타데이터. 배지처럼 클릭 행동이 없음

- Anatomy: icon, label
- Variants: saved, saving, unsaved
- States: default
- Token references: color.success, color.muted, color.danger

- Interaction kind: non-interactive
- Interaction reason: 저장 상태는 정보 표시 전용이며 클릭 가능한 행동을 갖지 않음

### Component: markdown-toolbar-button

**Semantics:** 에디터 상단 서식 도구. 누르면 현재 선택 영역에 마크다운 서식을 토글

- Anatomy: icon
- Variants: bold, italic, heading, link, list, code
- States: default, hover, focus-visible, active
- Token references: color.body, color.weak-background, radius.sm

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 서식 도구는 항상 사용 가능하며 비활성 상태를 갖지 않음 |
| loading | not-applicable | 노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음 |
| error | not-applicable | 해당 컴포넌트는 검증 실패 상태를 갖지 않음 |
| success | not-applicable | 해당 컴포넌트는 별도의 성공 상태를 표시하지 않음 |

### Rules

- 모든 interactive 컴포넌트는 default/hover/focus-visible을 반드시 구현한다

- 노트 카드, 사이드바 항목, 태그 칩처럼 목록형 인터랙티브 요소는 카드 테두리나 그림자를 추가하지 않고 배경색 변화(surface → weak-background)로만 hover/selected를 표현한다

- 저장 상태는 항상 아이콘과 문구를 함께 제공해 색만으로 의미를 전달하지 않는다

<!-- design-md:section layout-platforms -->
## 5. Layout & Platforms

### Responsive constraints

- Minimum supported width: 320px
- Reflow target: 200% zoom

### Layout rules

- 기본 레이아웃은 사이드바(폴더/태그) · 노트 목록 · 에디터+프리뷰의 3단 구성

- 320px~200% 확대까지 콘텐츠 손실 없이 리플로우되어야 하며, 좁은 화면에서는 3단을 순차적인 단일 컬럼으로 접는다

- 에디터와 프리뷰는 기본적으로 좌우 대등 2단이며, 좁은 화면에서는 탭 전환으로 대체한다

- 사이드바는 좁은 화면에서 오버레이로 전환하고 본문 위에 그림자 없이 불투명 배경으로 얹는다

### Platform: web

- 데스크톱 브라우저를 1차 대상으로 하며 키보드 단축키(굵게, 기울임, 검색 열기 등)를 지원한다
- 뷰포트 폭 320px부터 대형 데스크톱까지 대응하고, 모바일 브라우저는 단일 컬럼 축약 레이아웃을 사용한다

<!-- design-md:section content-locales -->
## 6. Content & Locales

### Voice

- 짧고 직접적으로 현재 상태와 다음 행동을 말한다 (예: "저장됨", "일치하는 노트가 없어요")

- 모호한 안심 문구나 불필요한 격식체를 쓰지 않는다

- 삭제·되돌리기 어려운 동작은 결과를 먼저 구체적으로 말하고 확인을 요청한다

- 노트 앱 맥락에서 "가치를 먼저 보여준다"는 토스 원칙을 빈 상태 문구에 적용한다 — 예: 빈 폴더에서는 무엇을 할 수 있는지 먼저 보여주고 행동을 유도한다

### Terminology

| Term | Preferred form |
|---|---|
| folder | 폴더 |
| note | 노트 |
| preview | 미리보기 |
| save | 저장 |
| search | 검색 |
| tag | 태그 |
| unsaved | 저장 안 됨 |

### Locale: ko (supported)

- 기본이자 유일하게 지원되는 로케일. 모든 UI 카피와 빈 상태 문구는 한국어로 작성된다

<!-- design-md:section governance -->
## 7. Governance

<!-- design-md:claim authority kind=project-system lang=en -->
### Authority

This document is the project design contract for the declared scope.
<!-- design-md:claim-end -->

<!-- design-md:claim application-priority order=prompt-fact,repository-fact,system-contract,reference-inspiration lang=en -->
### Application priority

1. Direct user instructions for the requested scope.
2. Repository facts.
3. This system contract.
4. Reference inspiration.
<!-- design-md:claim-end -->

<!-- design-md:claim unknowns policy=absent-at-smallest-unresolved-boundary lang=en -->
### Unknowns

Omit only the smallest unresolved value or group. Do not replace it with a plausible default.
<!-- design-md:claim-end -->

<!-- design-md:claim changes policy=review-record-validate-before-adoption lang=en -->
### Changes

Record, review, and validate changes before adoption.
<!-- design-md:claim-end -->

### Project priority details

1. 접근성 대비

2. 상태 명확성(저장/검색/빈 상태)

3. 토스 톤앤매너 보존

4. 구현 단순성

### Additional change rules

- 토스 검증 자료의 값(색상, 타이포, 버튼 지오메트리)을 바꾸려면 근거가 되는 새 검증 자료가 필요하다

- 그린필드로 제안된 값(success 색상, 카드 라운드, 모션, 모노스페이스)은 실제 사용 중 사용자 피드백에 따라 자유롭게 조정할 수 있다

### Decision provenance

- foundations.tokens.color.primary — verified-reference-inspiration; value: {"$description":"인터랙션 블루 — 버튼, 링크, 활성 탭 등 실제 행동에만 사용","$type":"color","$value":"#3182f6"}; evidence: .claude/data/references/toss/DESIGN.md#2. Color Palette & Roles
- foundations.tokens.color.canvas — verified-reference-inspiration; value: {"$description":"전체 배경, 에디터/프리뷰의 기본 캔버스","$type":"color","$value":"#ffffff"}; evidence: .claude/data/references/toss/DESIGN.md#2. Color Palette & Roles
- foundations.tokens.spacing.lg — verified-reference-inspiration; value: {"$type":"dimension","$value":"16px"}; evidence: .claude/data/references/toss/DESIGN.md#Spacing System
- foundations.tokens.color.success — agent-proposed-greenfield-decision; value: {"$description":"\"저장됨\" 같은 완료 상태 표시. 토스 검증 자료에 없는 값으로, 노트 앱의 저장 피드백을 위해 그린필드로 제안됨","$type":"color","$value":"#0b8f3a"}; evidence: DESIGN.md#Semantic tokens
- foundations.tokens.radius.card — agent-proposed-greenfield-decision; value: {"$description":"노트 카드/패널 라운드. 토스 마케팅 라운드(7px)와 TDS 버튼 라운드(16px) 사이에서 노트 앱 카드 표면을 위해 그린필드로 제안됨","$type":"dimension","$value":"12px"}; evidence: DESIGN.md#Semantic tokens
- typography_assets.roles.6 — agent-proposed-greenfield-decision; value: {"family":"typography.family.mono","id":"code","line_height":"22px","size":"14px","usage":"마크다운 소스 에디터, 인라인 코드, 코드 블록 — 토스 레퍼런스는 모노스페이스 토큰을 검증하지 않았으므로 그린필드로 제안","weight":400}; evidence: .claude/data/references/toss/DESIGN.md#Font Family
- typography_assets.fonts.toss-product-sans-redistribution-license — unresolved; evidence: .claude/data/references/toss/DESIGN.md#Font Family
- components_states.components.3 — agent-proposed-greenfield-decision; value: {"anatomy":["label"],"id":"tag-chip","interaction":{"kind":"interactive","state_applicability":{"default":{"applicability":"applicable"},"disabled":{"applicability":"not-applicable","reason":"태그 칩은 비활성 상태를 갖지 않음"},"error":{"applicability":"not-applicable","reason":"해당 컴포넌트는 검증 실패 상태를 갖지 않음"},"focus-visible":{"applicability":"applicable"},"hover":{"applicability":"applicable"},"loading":{"applicability":"not-applicable","reason":"노트 앱의 로컬 저장/렌더링 동작은 즉시 완료되어 로딩 대기 상태가 없음"},"success":{"applicability":"not-applicable","reason":"해당 컴포넌트는 별도의 성공 상태를 표시하지 않음"}}},"semantics":"노트에 붙는 태그. 토스 배지는 상태 메타데이터로 클릭 불가지만, 이 프로젝트의 태그는 클릭 시 해당 태그로 필터링되는 탐색 행동을 가지므로 그린필드로 인터랙티브하게 확장함","states":["default","hover","focus-visible","selected"],"token_refs":["color.weak-background","color.weak-foreground","radius.sm"],"variants":["fill","weak"]}; evidence: DESIGN.md#Component: tag-chip
- content_locales.locales.0 — prompt-fact; value: {"locale":"ko","rules":["기본이자 유일하게 지원되는 로케일. 모든 UI 카피와 빈 상태 문구는 한국어로 작성된다"],"status":"supported"}; evidence: DESIGN.md#Locale: ko (supported)
