## Context

동기는 proposal.md의 Why를, 동작은 `specs/note-tags/spec.md`를 본다. 여기서는 지금 코드가 이 설계를 어떻게 제약하는지만 적는다.

- `NoteRecord.tagIds: string[]`는 저장 형식과 `isNoteRecord` 검증에만 남아 있다. `NoteDoc.tagIds`는 `readonly` 일반 배열이라 반응형이 아니다. 새 노트는 늘 `[]`로 기록된다.
- 목록 범위는 `ui-state.svelte.ts`의 `Scope`(all | unfiled | folder)가 정한다. `inScope`, `isSameScope`, `scopeName`, `scopeFolderId`, `listEmptyShowsNewNote`가 모두 이 타입을 분기한다. 사이드바 active 표시는 `isSameScope(ui.scope, <항목 범위>)`다.
- 폴더 옮기기(`moveNote`)가 "메타데이터 변경은 대기 없이 저장하고 수정 시각은 두며, 기록 전 새 노트는 기록하지 않는다"는 선례다. `autosave.schedule(id)` 다음에 `flush(id)`를 부른다.
- `NoteCard`는 제목 버튼을 `::after`로 카드 전체에 늘린다. 카드 안의 다른 버튼은 `position: relative; z-index: 1`로 그 위에 올려야 따로 눌린다. 목업 시절 태그 칩이 이 방식을 썼다(`a653abf`에서 제거).
- `TagChip`은 `aria-pressed`를 가진 동작 없는 버튼이다. `Icon`에는 `hash`와 `x`가 이미 있다.
- 입력 컴포넌트는 DESIGN.md 규칙상 보이는 라벨이나 앞쪽 아이콘과 placeholder를 가져야 한다. 기본 테두리는 `color.border`이고, hover에서는 `color.muted`, focus-visible에서는 primary 링이다.

## Goals / Non-Goals

**Goals:**
- 태그를 노트 레코드 안의 이름 배열 하나로만 두고, 태그 목록과 제안은 모두 노트에서 파생한다. 태그 전용 저장 키나 개체를 만들지 않는다.
- 태그 범위를 기존 `Scope` 한 종류로 추가해, 목록 정렬과 편집 중 위치 고정, 열린 노트 유지, 빈 상태 분기를 폴더와 같은 경로로 처리한다.
- 태그 변경은 폴더 옮기기와 같은 저장 경로를 탄다.

**Non-Goals:**
- 모든 노트에서 태그 이름을 한꺼번에 바꾸거나 지우는 API. 파생 모델에서는 여러 노트를 다시 저장하는 일이라, 필요해질 때 `deleteFolder`와 같은 부분 실패 처리를 함께 설계한다.
- 직접 그린 콤보박스. 제안은 네이티브 `<datalist>`에 맡긴다.

## Decisions

### D1. 태그는 노트 레코드의 이름 배열이다

- `NoteRecord.tagIds`를 `tags: string[]`로 바꾼다. 값은 정리된 태그 이름이고 붙인 순서다. `isNoteRecord`는 `tags`가 문자열 배열인지 검사한다.
- `SCHEMA_VERSION`은 1로 둔다. 배포된 적이 없어 이관할 저장본이 없다(사용자 결정). 버전을 올리면 v1을 읽어 v2로 옮기는 코드가 생기는데, 그 코드가 다룰 데이터가 없다.
- `NoteDoc.tags`는 `$state<string[]>`다. 배열 자체를 바꿔 넣는다(`note.tags = [...note.tags, name]`). 붙이기와 떼기를 한 곳에서만 하므로, 제자리에서 고치는 경로가 생기지 않는다.
- 대안으로 따로 저장하는 태그 개체(`TagRecord`, `tag:v1:<id>`)를 검토했다. 태그를 먼저 만들어야 붙일 수 있고, 빈 태그라는 쓸모없는 상태가 생겨서 기각했다(proposal에서 결정).
- 원문 속 해시태그도 검토했다. `#회의에서`처럼 한국어 조사가 태그에 붙어 들어가서 기각했다.

### D2. 이름 비교 키와 사용 중인 태그 파생

- 비교 키는 `tagKey(name) = name.toLocaleLowerCase('ko')`다. 정리(`normalizeTagInput`)는 앞뒤 공백 제거, 맨 앞 `#`들과 그 뒤 공백 제거 순서다. 둘 다 순수 함수로 `notes.svelte.ts` 옆 작은 모듈(`src/lib/tags.ts`)에 둔다.
- `notes.svelte.ts`에 `$derived`로 `usedTags: Map<key, spelling>`을 둔다. 모든 노트(기록 전 새 노트 포함)를 목록 순서대로 훑으며, 키가 처음 나온 철자를 쓴다.
  - 철자 통일: 붙일 때 `usedTags.get(key) ?? name`
  - 제안 목록: `usedTags` 값 중 이 노트에 없는 것을 `Intl.Collator('ko')`로 정렬
- 파생이라 붙이기, 떼기, 삭제, 기록 전 새 노트 정리에 따로 대응할 필요가 없다. 노트 수가 적은 로컬 앱이라 전체를 다시 훑어도 비용이 문제되지 않는다.
- 철자 통일 규칙 덕분에 한 키의 철자는 보통 하나다. 둘이 되는 경우는 저장본을 손으로 고쳤을 때뿐이고, 그때도 첫 철자를 결정적으로 고른다.

### D3. 태그 변경의 저장

- `notes.svelte.ts`에 `addTag(note, raw)`와 `removeTag(note, name)`을 둔다. 둘 다 `moveNote`와 같은 방식이다.
  - 바뀌지 않았으면 아무것도 하지 않는다(빈 이름, 이미 있는 키).
  - `updatedAt`은 건드리지 않는다.
  - `draft`면 여기서 끝낸다.
  - 아니면 `schedule`과 `flush`를 부른다.
- 수정 시각을 두는 이유는 폴더 옮기기와 같다. 내용을 고친 게 아니고, 편집 중 위치 고정이 없는 다른 카드의 목록 위치를 흔들지 않기 위해서다.
- `createNote(folderId, tags = [])`로 시그니처를 넓힌다. 기록 전 새 노트는 첫 기록 때 `toRecordFormat()`이 그 시점의 `tags`를 싣는다. 스펙의 "첫 기록 시점의 태그" 규칙은 이것으로 따로 처리할 게 없다.

### D4. 태그 범위

- `Scope`에 `{ kind: 'tag'; key: string; name: string }`을 더한다. `name`은 제목과 칩 표시용 철자이고, 비교는 `key`로 한다.
- `inScope`는 `note.tags.some((t) => tagKey(t) === scope.key)`다.
- `isSameScope`는 지금 `kind`가 folder가 아니면 `kind`만 비교한다. 이대로면 서로 다른 태그 범위가 같다고 나오므로 tag도 `key`까지 비교하도록 고친다.
- 사이드바 항목은 모두 all/unfiled/folder 범위와 비교하므로 태그 범위에서는 자연히 active가 없다. 사이드바 코드는 바꾸지 않는다.
- `scopeName`은 `#${name}`을 돌려준다. 보던 태그가 모든 노트에서 사라져도 `name`이 범위에 남아 있어 제목이 유지된다.
- `startNewNote`는 폴더 id와 함께 태그 범위의 `name`(가능하면 `usedTags`의 현재 철자)을 `createNote`에 넘긴다. 폴더는 `''`다.
- `listEmptyShowsNewNote`는 태그 범위면 `false`를 돌려준다. 지금 식은 "노트가 0개면 true"라서, 노트가 하나도 없을 때 태그 범위를 보고 있으면 목록에도 에디터에도 "새 노트" 버튼이 없게 된다.
- 대안으로 폴더 범위 위에 겹치는 `tagFilter`를 검토했다. 사이드바 active가 둘이 되고 제목과 빈 상태 조합이 늘어나서 기각했다(proposal에서 결정).

### D5. 카드 칩

- `NoteCard`의 `.meta` 안에 `<ul aria-label="태그">`로 칩 목록을 다시 둔다. 목록은 `position: relative; z-index: 1`로 늘린 제목 버튼 위에 올린다.
- 칩을 누르면 `selectScope({ kind: 'tag', key, name })` 뒤에 `tick()`을 기다리고 `#note-list-title`에 포커스를 준다. 이것도 선택 노트를 바꾸지 않는 범위 전환이라 `selectNote()`를 거치지 않는다.
- 지금 태그 범위와 키가 같은 칩은 `selected`이고 `aria-current="true"`를 가진다. 누르면 아무것도 하지 않는다.
- `TagChip`의 `aria-pressed`는 뺀다. 이 칩은 켜고 끄는 토글이 아니라 범위로 가는 탐색 버튼이라서, "선택된 상태"를 `aria-current`로 표현한다.
- 칩 라벨은 `#` + 이름이다. 긴 이름을 위해 `overflow-wrap: anywhere`를 준다.
- selected 카드 위의 weak 칩은 배경이 같아 구분이 안 된다. 목업 시절처럼 selected 카드 안에서는 칩 배경을 `color.canvas`로 바꾼다.

### D6. 에디터 태그 줄

- `EditorPane`의 상단 줄과 서식 도구 사이에 새 `TagInput` 컴포넌트를 둔다. 구성은 보이는 라벨 "태그"(폴더 선택의 "폴더"와 같은 모양), 칩 목록, 입력창과 `<datalist>`다.
- 칩 목록은 `TagChip`의 떼기 가능한 변형이다. 이 변형은 라벨 텍스트와 x 버튼으로 이뤄지고, x 버튼의 접근성 이름은 "<이름> 태그 떼기"다. 칩 본문은 버튼이 아니라서 눌러도 범위가 바뀌지 않는다.
- Enter 처리
  - `keydown`에서 `event.isComposing`이면 무시한다(입력기 조합 확정 Enter). `isComposing`은 Baseline Newly available(Safari 27에서 이벤트 순서 버그 수정)이라, 프로젝트 브라우저 정책에 따라 이전 Safari용 우회(`keyCode === 229`, `compositionend` 시각 비교)는 두지 않는다.
  - 그 외 Enter면 `preventDefault` 후 `addTag`를 부르고 입력값을 비운다.
  - 붙이지 않은 입력은 blur나 노트 전환 때 붙이지 않는다.
- 노트가 바뀌면 입력값이 남지 않도록 `{#key note.id}`로 컴포넌트를 다시 만든다.
- 떼기 뒤에는 x 버튼이 사라지므로 포커스를 입력창으로 옮긴다.
- `<datalist>`의 `id`는 `$props.id()`로 만든다. 제안은 D2의 목록이다.
- 대안으로 버튼을 눌러 입력창을 펼치는 방식과 ARIA 콤보박스를 검토했다. 앞의 것은 한 단계가 늘고 펼침·닫힘 포커스 관리가 필요하다. 뒤의 것은 접근성을 직접 구현하고 검증해야 한다. 둘 다 기각했다(사용자 결정).

### D7. 태그 범위 빈 상태

- `NoteList` 분기 순서는 `forced.searchEmpty`, **태그 범위이고 노트 없음**, 빈 폴더, 노트 0개, 폴더 없음 비었음이다. 태그 범위가 노트 0개보다 먼저 와야, 노트를 모두 지운 뒤에도 제목 `#회의` 아래에 맞는 문구가 보인다.
- 아이콘은 `hash`다. 문구 초안은 제목 "#회의가 붙은 노트가 없어요", 설명 "노트에 이 태그를 붙이면 여기에 모여요."이고 버튼은 없다.

### D8. 디자인 계약 갱신 순서

화면 코드보다 먼저 `omd:remember`로 교정을 기록하고 `omd:learn`으로 DESIGN.md에 반영한다. 기록할 교정은 다음과 같다.
- `tag-input` 컴포넌트 추가: 보이는 라벨, `color.border` 테두리, `radius.md`, default/hover/focus-visible 상태
- `tag-chip`에 `removable` 변형 추가, 누르면 태그 범위로 이동, selected는 `aria-current`
- `sidebar-nav-item`의 `tag` 변형 제거
- 레이아웃 규칙 "사이드바(폴더/태그)"와 h3 역할의 "폴더/태그 그룹 헤더" 표현 정리

## Risks / Trade-offs

- [`<datalist>`의 모양과 매칭 방식은 브라우저마다 다름(접두/부분 일치, iOS의 키보드 위 제안 막대)] → 역할이 "쓰던 철자로 맞추기"라 받아들인다. 불편하면 `TagInput` 안에서만 콤보박스로 바꾼다.
- [제안을 키보드로 고르는 Enter가 브라우저에 따라 `keydown` Enter로도 들어와 곧바로 붙을 수 있음] → 제안을 고르는 것 자체가 붙이려는 의도라 결과가 같다. 구현할 때 Chrome, Safari, Firefox에서 두 번 붙거나 빈 값이 붙지 않는지 확인한다. 중복은 D3에서 무시된다.
- [보던 태그가 사라진 뒤에도 태그 범위가 남음] → 스펙이 의도한 동작이다(편집의 부수 효과로 화면을 바꾸지 않음). 사이드바 항목으로 나갈 수 있다.
- [태그가 많은 카드는 높이가 커짐] → 줄바꿈으로 받아들인다. 개수 제한은 두지 않는다.
- [개발 중인 브라우저의 기존 노트가 `tags` 필드가 없어 목록에서 빠짐] → 저장본은 지우지 않는다. 필요하면 개발자가 저장소를 비운다.

## Migration Plan

- 이관 작업은 없다(D1).
- 되돌리면 이전 버전의 `isNoteRecord`가 `tagIds`를 요구하므로, 이 버전이 기록한 노트는 이전 버전에서 건너뛰어진다. 지워지지는 않는다. 배포 전이라 받아들인다.

## Open Questions

- 태그 범위 빈 상태와 태그 줄 placeholder의 최종 문구는 구현 뒤 화면에서 다듬는다. 스펙은 의미만 정한다.
