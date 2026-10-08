## Context

동기는 proposal.md의 Why를, 동작은 `specs/markdown-formatting/spec.md`를 본다. 여기서는 지금 코드가 이 설계를 어떻게 제약하는지만 적는다.

- `MarkdownToolbarButton`은 `variant`(bold, italic, heading, link, list, code)만 받는 동작 없는 버튼이다. `EditorPane`이 `role="toolbar"` 안에 6개를 그린다. 툴바는 태그 줄 아래, 편집/미리보기 탭 위에 있어서 1024px 미만의 미리보기 탭에서도 보인다.
- 원문은 `EditorPane`의 `<textarea bind:value={note.source} oninput={() => markEdited(note)}>`다. `markEdited`가 수정 시각을 바꾸고 자동 저장을 예약하며, 기록 전 새 노트는 원문이 비어 있지 않을 때 기록 대상으로 바뀐다. 원문 요소는 `source` 변수에 `bind:this`로 잡혀 있다.
- textarea에 값을 직접 넣으면(`note.source = …`, `textarea.value = …`, `setRangeText`) 브라우저의 되돌리기 기록이 끊긴다. 되돌리기 기록에 남는 프로그램 편집은 `document.execCommand('insertText' | 'delete')`뿐이다. 이 API는 deprecated로 표시되어 있지만 지원 대상 브라우저의 textarea에서 모두 동작하고, 대체 API는 아직 없다.
- 전역 단축키 선례는 `EditorPane`의 `Cmd/Ctrl+S`다(`metaKey || ctrlKey`, alt·shift 없음, `key.toLowerCase()`). 입력기 조합 중 키를 무시하는 선례는 `TagInput`과 `SearchInput`에 있다.
- 테스트 러너가 없다. 지난 변경들은 순수 함수를 개발 서버에서 `import()`해 콘솔로 확인했다.

## Goals / Non-Goals

**Goals:**
- 서식 규칙은 DOM을 모르는 순수 함수로 둔다. 원문을 바꾸는 브라우저 API는 한 파일에만 둔다. 그래서 `execCommand`를 바꿀 때 서식 규칙을 건드리지 않는다.
- 서식 적용이 사용자의 입력과 같은 `input` 이벤트 경로를 타게 해서, 미리보기, 카드, 수정 시각, 자동 저장에 별도 코드를 더하지 않는다.

**Non-Goals:**
- 마크다운 파서를 써서 커서 자리의 서식을 판정하는 일. 풀기 판정은 선택 영역 바로 안팎의 기호만 본다. 그래서 `**a** b **c**`에서 `a** b **c`를 선택한 경우처럼 문법상 서식 경계와 어긋나는 선택은 기호만 보고 처리한다.
- 직접 만든 되돌리기 기록. 브라우저 기록을 쓰고, 그것이 불가능해지면 그때 교체한다(D2).

## Decisions

### D1. 서식 함수는 새 원문과 새 선택 영역을 돌려준다

- `src/lib/markdown/format.ts`에 `format(variant, text, selStart, selEnd) → { text, selStart, selEnd }`를 둔다. variant별 규칙은 이 모듈 안의 함수로 나눈다. 인라인 감싸기(굵게, 기울임, 인라인 코드)는 한 함수에 기호만 달리 넘긴다. 코드 블록, 줄 서식(제목, 목록), 링크는 각자 함수를 둔다.
- 반환값을 바꿀 범위(`from`, `to`, `insert`)가 아니라 전체 원문으로 정했다. 여러 줄 목록처럼 떨어진 곳을 여러 번 바꾸는 규칙도 문자열 조작 한 번으로 쓸 수 있어 규칙 코드가 단순해진다.
- 바꿀 범위는 같은 모듈의 `toEdit(oldText, result) → Edit`가 앞뒤 공통 부분을 잘라 계산한다. `Edit = { from, to, insert, selStart, selEnd }`이고, 이 타입이 DOM 쪽과의 유일한 계약이다(D2).
  - 공통 부분을 자르면 반복 글자 옆(`*` 옆에 `**`를 넣는 경우 등)에서 바꾼 위치가 규칙의 의도와 몇 글자 어긋날 수 있다. 그래도 결과 원문은 같고, 선택 영역은 `selStart`, `selEnd`로 따로 맞추므로 사용자가 보는 결과는 같다.
- 대안으로 규칙 함수가 `Edit`를 직접 만드는 방식을 검토했다. 줄 서식에서 범위를 손으로 계산해야 해서 버그가 생기기 쉬워 기각했다.

### D2. `apply-edit.ts`가 유일한 DOM 접점이다

- `src/lib/markdown/apply-edit.ts`의 `applyEdit(textarea, edit)`는 다음 순서로 동작한다.
  1. `focus()`
  2. `setSelectionRange(from, to)`
  3. `insert`가 있으면 `execCommand('insertText', false, insert)`, 비어 있으면 `execCommand('delete')`
  4. `setSelectionRange(selStart, selEnd)`
- `insertText`에 빈 문자열을 넘기면 브라우저마다 동작이 달라서, 지우기는 `delete`로 나눈다. `from === to`이고 `insert`도 비어 있으면 아무것도 하지 않는다.
- `execCommand`가 `false`를 돌려주거나 함수가 없으면 대체 경로를 쓴다. `textarea.setRangeText(insert, from, to)`를 부르고 `new Event('input', { bubbles: true })`를 직접 보낸다. 이때 되돌리기 기록만 잃고 서식, 저장, 미리보기는 그대로다.
- 두 경로 모두 `input` 이벤트를 일으키므로 `bind:value`가 `note.source`를 갱신하고 `oninput`이 `markEdited`를 부른다. 서식 쪽에서 `note.source`에 값을 넣거나 `markEdited`를 부르지 않는다. 두 번 반영되는 일을 막기 위해서다.
- `execCommand`를 쓰는 곳은 이 파일뿐이다. 브라우저 지원이 끊기거나 원문 영역을 CodeMirror 같은 에디터로 바꾸면 이 파일만 다시 쓴다. CodeMirror의 변경 단위(`{from, to, insert}`)와 `Edit`는 모양이 같다. 이 결정과 이유를 파일 머리 주석에 적는다.
- CLAUDE.md의 Browser support 규칙과의 관계: `execCommand`는 Baseline 신규 기능이 아니라 예전부터 있던 API이고, 지원 대상 브라우저가 모두 지원한다. 대체 경로가 있어 지원이 끊겨도 기능은 남는다.

### D3. 선택 영역 보존과 포커스

- textarea는 포커스를 잃어도 `selectionStart`, `selectionEnd`를 유지한다. 그래서 버튼을 누를 때 따로 저장하지 않고 그 순간의 값을 읽는다.
- 마우스로 누를 때 버튼이 포커스를 가져가 원문이 잠깐 흐려지거나 스크롤이 튀지 않게, 버튼의 `mousedown`에서 `preventDefault()`한다. 키보드로 누르면 포커스가 버튼에 있다가 `applyEdit`의 `focus()`로 원문에 간다.
- 툴바는 원문 textarea를 직접 모르게 한다. `EditorPane`이 `onformat(variant)` 콜백을 버튼에 넘기고, 콜백 안에서 `source`(bind:this)로 `format` → `toEdit` → `applyEdit`를 부른다.

### D4. 단축키

- 원문 textarea의 `onkeydown`에서만 처리한다. `metaKey || ctrlKey`이고 `altKey`, `shiftKey`가 없으며 `isComposing`이 아닐 때다.
- 키 판정은 `event.key.toLowerCase()`가 `b` 또는 `i`인지 본다. 한국어 자판이 켜져 있으면 `key`가 `ㅠ`, `ㅑ`로 올 수 있어, `key`가 영문자가 아니면 `event.code`(`KeyB`, `KeyI`)로 다시 본다. 영문 자판 배열이 다른 경우(Dvorak 등)에도 글자 기준이 먼저 맞도록 이 순서로 정했다.
- 처리하면 `preventDefault()`한다. 링크(`Cmd/Ctrl+K`)는 검색 단축키가 쓰고 있어 두지 않는다.

### D5. 툴바 roving tabindex

- `EditorPane`이 `activeIndex`를 `$state`로 갖고, 버튼마다 `tabindex={i === activeIndex ? 0 : -1}`을 넘긴다. 버튼이 `focus`될 때 `activeIndex`를 그 버튼으로 바꾼다.
- 툴바 `keydown`에서 `ArrowRight`, `ArrowLeft`는 양 끝에서 반대쪽으로 넘어가고, `Home`, `End`도 처리한다. 다른 키는 그대로 둔다(Tab은 툴바 밖으로 나간다).
- `activeIndex`는 노트를 바꿔도 유지한다. `EditorPane`이 다시 만들어질 때만 0으로 돌아간다.

### D6. 미리보기 탭에서 툴바 숨기기

- `.toolbar`에 `data-tab={ui.editorTab}`를 두고, 1023px 이하 미디어 쿼리에서 `[data-tab='preview']`이면 `display: none`으로 숨긴다. 탭 전환과 같은 미디어 쿼리 블록에 둔다.
- 숨기면 툴바 아래 경계선도 사라진다. 대신 탭 줄의 경계선이 보이므로 영역 구분은 유지된다.

## Risks / Trade-offs

- [브라우저가 textarea의 `execCommand('insertText')` 지원을 끊음] → D2의 대체 경로로 서식은 계속 동작하고 되돌리기만 잃는다. 교체 범위는 `apply-edit.ts` 한 파일이다.
- [`execCommand`와 Svelte `bind:value`가 엇갈림: input 이벤트가 오기 전에 Svelte가 이전 값으로 덮어씀] → `execCommand`는 동기로 input 이벤트를 보내므로 `bind:value`가 같은 틱에 새 값을 받는다. 4.1 확인 작업에서 빠르게 연속으로 누르는 경우를 본다.
- [기록 전 새 노트에서 버튼을 누르면 `****` 같은 기호만으로 기록 대상이 됨. "빈 새 노트 정리" 규칙상 기호를 다시 지워도 "제목 없음" 노트로 남음] → 기호도 사용자가 넣은 글자라 직접 입력한 경우와 같게 다룬다. 실제 사용에서 빈 노트가 쌓이면, 별도 변경에서 정리 판정을 "서식 기호만 있는 원문"까지 넓히는 방안을 검토한다.
- [풀기 판정이 선택 영역 바로 안팎만 봄: `**a** b`에서 커서만 `a` 옆에 두고 굵게를 누르면 풀리지 않고 `****`가 들어감] → 스펙이 정한 동작이다. 커서 자리 서식 판정은 범위에서 뺐다(proposal).
- [공통 부분 자르기로 계산한 바꿀 범위가 의도와 다름] → 결과 원문과 선택 영역은 같다(D1). 되돌리기 후 커서 위치가 한두 글자 다를 수 있다.

## Migration Plan

저장 형식은 바뀌지 않는다. 되돌리려면 이 변경의 커밋을 되돌리면 된다.
