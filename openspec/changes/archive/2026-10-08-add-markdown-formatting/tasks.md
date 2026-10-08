## 1. 디자인 계약

- [x] 1.1 `omd:remember`로 `markdown-toolbar-button` 교정을 `.omd/preferences.md`에 기록하고, `omd:learn`으로 System Graph에 합쳐 DESIGN.md를 다시 생성한다. 기록할 내용:
  - `active`는 누르는 동안의 상태이고, 커서 자리 서식에 따른 눌린 상태(`aria-pressed`)는 없다.
  - 툴바는 roving tabindex(화살표, Home/End)를 쓴다.
  - Cmd/Ctrl+B, Cmd/Ctrl+I 단축키가 있다.
  - 레이아웃 규칙: 1024px 미만 미리보기 탭에서는 서식 도구를 숨긴다.

  완료 확인: DESIGN.md "Components & States"의 `markdown-toolbar-button`과 "Layout rules"에 위 내용이 있고, `.omd/system/manifest.json`의 해시가 새 projection과 맞는다.

## 2. 서식 규칙 (순수 함수)

- [x] 2.1 `src/lib/markdown/format.ts`에 `Edit` 타입, `toEdit(oldText, result)`, 인라인 감싸기/풀기(굵게, 기울임, 인라인 코드)를 만든다(D1). 개발 서버 콘솔에서 `import('/note/src/lib/markdown/format.ts')`로 스펙 "인라인 서식 감싸기와 풀기"의 시나리오를 하나씩 넣어 본다. 완료 확인:
  - 시나리오마다 결과 원문과 선택 영역이 스펙과 같다.
  - 앞뒤 공백 제외, 빈 쌍 넣기와 지우기, `**중요**` → 기울임 → `***중요***` → 굵게 → `*중요*`, 여러 줄 굵게, 백틱이 든 인라인 코드를 확인한다.
  - `pnpm check`가 통과한다.
- [x] 2.2 같은 모듈에 코드 블록(여러 줄 코드 감싸기/풀기), 줄 서식(제목, 목록), 링크 규칙을 더한다. 완료 확인:
  - 스펙의 "줄 서식 붙이기와 떼기", "링크 넣기", "여러 줄 코드 블록" 시나리오를 콘솔에서 확인한다. 들여쓴 체크박스 떼기, 번호 목록을 `- `로 바꾸기, 빈 줄 건너뛰기, 주소 선택 링크를 포함한다.
  - 적용 뒤 원래 선택한 글자가 그대로 선택되는지 본다.
  - `toEdit` 결과를 원문에 적용하면 규칙이 돌려준 원문과 같은지 시나리오마다 본다.

## 3. 원문 적용과 연결

- [x] 3.1 `src/lib/markdown/apply-edit.ts`에 `applyEdit(textarea, edit)`를 만든다. `execCommand` 경로와 `setRangeText` + `input` 이벤트 대체 경로를 넣고, 머리 주석에 교체 이유와 범위를 적는다(D2). 완료 확인:
  - `grep -rn execCommand src`의 결과가 이 파일뿐이다.
  - 콘솔에서 `document.execCommand`를 잠깐 `() => false`로 바꿔도 서식이 적용되고 미리보기와 저장 상태가 바뀐다.
- [x] 3.2 `MarkdownToolbarButton`에 `onclick`, `mousedown` `preventDefault`, `tabindex`, `onfocus` props를 더하고 뼈대 주석을 지운다. `EditorPane`에서 `onformat(variant)` → `format` → `toEdit` → `applyEdit`로 잇는다(D3). 완료 확인: 1280px에서 스펙 "서식 적용은 원문 수정이다"의 두 시나리오를 손으로 확인한다. 굵게 적용 뒤 미리보기, 카드 수정 시각, 저장 상태가 바뀌고, 되돌리기 한 번이면 서식만 취소된다.
- [x] 3.3 원문 textarea에 Cmd/Ctrl+B, Cmd/Ctrl+I 단축키를 붙인다(D4). 완료 확인:
  - 원문에서 두 단축키가 동작하고 브라우저 기본 동작이 없다.
  - 한국어 자판 상태에서도 동작한다.
  - Shift를 함께 누르거나 입력기 조합 중이거나 태그 입력창에 포커스가 있으면 원문이 그대로다.
- [x] 3.4 툴바 roving tabindex와 화살표, Home, End 키를 붙인다(D5). 완료 확인: 스펙 "서식 도구 키보드 탐색" 시나리오를 키보드만으로 확인한다. Enter나 Space로 누르면 서식이 적용되고 포커스가 원문으로 간다.
- [x] 3.5 1023px 이하 미리보기 탭에서 툴바를 숨긴다(D6). 완료 확인: 900px과 375px에서 스펙 "좁은 폭 탭 전환" 시나리오를 확인하고, 1280px에서는 툴바가 늘 보인다.

## 4. 통합 확인

- [x] 4.1 `specs/markdown-formatting/spec.md`의 모든 시나리오와 `note-ui-skeleton`의 "노트 열기와 원문 편집" 시나리오를 Chrome, Safari, Firefox 최신판의 1280px에서 손으로 확인한다. 900px, 375px에서는 툴바 숨김과 단축키를 확인한다. 완료 확인:
  - 시나리오마다 통과하고, 실패하면 해당 작업으로 돌아간다.
  - 서식 버튼을 빠르게 연속으로 눌러도 원문과 미리보기가 어긋나지 않는다.
  - 세 브라우저 모두 되돌리기가 서식 적용 단위로 동작하는지 PR 설명에 적는다.
- [x] 4.2 접근성과 모션을 확인한다. 완료 확인: 버튼 6개의 한국어 이름이 읽힌다. 툴바 버튼에 포커스 링이 보인다. 320px와 200% 확대에서 툴바가 잘리지 않고 줄바꿈된다. `prefers-reduced-motion`에서 전환이 없다.
- [x] 4.3 `pnpm check`와 `pnpm build`를 통과시킨다. 완료 확인: 두 명령이 오류 없이 끝난다.
