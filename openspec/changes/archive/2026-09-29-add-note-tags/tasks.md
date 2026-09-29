## 1. 디자인 계약

- [x] 1.1 D8의 교정 네 가지를 `omd:remember`로 `.omd/preferences.md`에 기록하고 `omd:learn`으로 System Graph에 합쳐 DESIGN.md를 다시 생성한다. 네 가지는 `tag-input` 추가, `tag-chip`의 removable 변형과 탐색 동작, `sidebar-nav-item`의 tag 변형 제거, 레이아웃과 h3 표현 정리다 — DESIGN.md "Components & States"에 `tag-input`이 state applicability와 함께 있고, `sidebar-nav-item` Variants에 `tag`가 없으며, `.omd/system/manifest.json`의 해시가 새 projection과 맞는지 확인

## 2. 저장 형식과 태그 규칙

- [x] 2.1 `store.ts`의 `NoteRecord.tagIds`를 `tags`로 바꾸고 `isNoteRecord`를 맞춘다(D1). `SCHEMA_VERSION`은 1 그대로다 — `pnpm check` 통과, DevTools에서 `tagIds`만 있는 레코드가 목록에서 빠지고 저장본은 그대로인지 확인
- [x] 2.2 `src/lib/tags.ts`에 `normalizeTagInput`(앞뒤 공백, 맨 앞 `#`들과 그 뒤 공백 제거)과 `tagKey`(`toLocaleLowerCase('ko')`)를 만든다(D2) — `pnpm check` 통과, `'  #할 일 '` → `'할 일'`, `'#'` → `''`, `tagKey('React') === tagKey('react')`를 콘솔에서 확인

## 3. 노트 상태

- [x] 3.1 `NoteDoc.tags`를 `$state<string[]>`로 바꾸고 `toRecordFormat`이 `tags`를 싣게 한다. `createNote(folderId, tags = [])`로 넓힌다(D1, D3) — `pnpm check` 통과
- [x] 3.2 `notes.svelte.ts`에 파생값 `usedTags`(키 → 철자, 기록 전 새 노트 포함)와 가나다순 제안 목록 함수를 추가한다(D2) — 태그를 붙이고 떼고 노트를 지울 때 제안 목록이 즉시 바뀌는지 4.x 이후 확인
- [x] 3.3 `addTag(note, raw)`와 `removeTag(note, name)`을 D3대로 구현한다. 빈 이름과 중복은 무시하고, 다른 노트의 철자를 따르며, 수정 시각은 두고, draft는 기록하지 않고, 그 밖에는 schedule 후 flush한다 — 태그를 붙인 직후 새로고침하면 태그가 남고 `updatedAt`이 그대로인지 DevTools로 확인

## 4. 태그 범위

- [x] 4.1 `ui-state.svelte.ts`의 `Scope`에 `{ kind: 'tag', key, name }`을 추가하고 `inScope`, `isSameScope`(태그 key 비교), `scopeName`(`#이름`)을 고친다(D4) — `pnpm check` 통과, 태그 범위에서 사이드바에 active 항목이 없는지 확인(5.x 이후)
- [x] 4.2 `startNewNote`가 태그 범위에서 그 태그를 붙인 폴더 없음 새 노트를 만들고, `listEmptyShowsNewNote`가 태그 범위에서 `false`를 돌려주게 한다(D4) — "#회의"에서 "새 노트"를 누르면 카드와 에디터에 "회의" 칩이 있고 폴더 선택이 "폴더 없음"인지 확인
- [x] 4.3 `NoteList`에 태그 범위 빈 상태를 D7 분기 순서대로 추가한다(`hash` 아이콘, 버튼 없음) — 보던 태그를 유일한 노트에서 떼거나 그 노트를 지우면 제목 "#회의"와 빈 상태 문구가 보이고, 노트가 0개일 때도 같은 빈 상태이며 에디터 빈 상태에 "새 노트" 버튼이 있는지 확인

## 5. 카드 칩

- [x] 5.1 `TagChip`에서 `aria-pressed`와 "뼈대 단계" 주석을 지우고, `onclick`, selected 시 `aria-current="true"`, 긴 이름 줄바꿈을 넣는다. 떼기 가능한 변형(라벨 + "<이름> 태그 떼기" x 버튼)도 추가한다(D5, D6) — `pnpm check` 통과
- [x] 5.2 `NoteCard`에 태그 칩 목록을 다시 넣는다. 늘린 제목 버튼 위로 올리고, selected 카드에서는 칩 배경을 canvas로 둔다. 칩을 누르면 태그 범위로 가고 목록 제목에 포커스가 간다(D5) — 칩 클릭으로 노트가 열리지 않고 에디터의 노트가 그대로이며, 보고 있는 태그의 칩이 selected이고 눌러도 변화가 없는지 1280px와 375px에서 확인

## 6. 에디터 태그 줄

- [x] 6.1 `TagInput.svelte`를 만든다. 보이는 "태그" 라벨, 떼기 가능한 칩 목록, 입력창과 `<datalist>`로 이뤄진다. Enter로 붙이되 입력기 조합 중 Enter는 무시한다. 떼기 뒤에는 입력창으로 포커스를 옮긴다(D6) — 한국어 입력기로 `회의`를 조합 중 Enter를 누르면 붙지 않고, 한 번 더 누르면 붙는지 확인. 빈 입력창에서 Backspace로 태그가 떨어지지 않는지 확인
- [x] 6.2 `EditorPane`의 상단 줄과 서식 도구 사이에 `{#key note.id}`로 감싼 `TagInput`을 둔다 — 노트 A 입력창에 글자를 남기고 노트 B를 열면 입력창이 비어 있는지 확인. 320px 폭에서 60자 태그를 붙여도 가로 스크롤이 없는지 확인
- [x] 6.3 `<datalist>`로 제안을 골라 붙이는 동작을 Chrome, Safari, Firefox에서 확인한다(Risks의 Enter 중복) — 세 브라우저에서 제안을 골랐을 때 태그가 한 번만 붙고 빈 태그가 붙지 않는지 확인

## 7. 통합 확인

- [x] 7.1 `specs/note-tags/spec.md`의 모든 시나리오와 수정된 `note-ui-skeleton`, `note-folders`, `note-persistence` 시나리오를 1280px, 900px, 375px에서 손으로 확인한다 — 시나리오마다 통과하는지 확인하고, 실패하면 해당 작업으로 돌아간다
- [x] 7.2 키보드만으로 카드 칩, 태그 입력창, 떼기 버튼을 쓸 수 있고 포커스 링이 보이며, VoiceOver가 "회의 태그 떼기"와 입력창 이름 "태그"를 읽는지 확인한다. `prefers-reduced-motion`에서 칩 전환이 즉시인지도 확인한다 — 확인 결과를 PR 설명에 적는다
- [x] 7.3 `pnpm check`와 `pnpm build`를 통과시킨다 — 두 명령이 오류 없이 끝나는지 확인
