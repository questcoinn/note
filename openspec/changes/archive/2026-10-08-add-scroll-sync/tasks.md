## 1. 미리보기 앵커

- [x] 1.1 `src/lib/markdown/render.ts`에 core 규칙 `source-line`을 더해 블록 토큰에 `data-source-line`을 넣고, 정화 호출 옆에 이 속성에 기대는 곳이 있다는 주석을 남긴다(D2). 완료 확인:
  - 개발 서버 콘솔에서 `render.ts`를 `import()`해 제목, 문단, 목록(느슨한 목록, 촘촘한 목록), 인용, 표, fence, 들여쓴 코드, 구분선, 체크박스 목록이 든 원문을 `renderHtml(parse(...))`에 넣는다. 각 블록 요소에 원문 시작 줄과 같은 `data-source-line`이 남아 있다.
  - 같은 원문의 `extractTitleAndSnippet`, `extractSearchText` 결과가 변경 전과 같다.
  - `pnpm check`가 통과한다.

## 2. 대응 함수와 측정

- [x] 2.1 `src/lib/scroll-sync/map.ts`에 `lineAt`, `yOfLine`, `buildKnots`, `srcToPv`, `pvToSrc`를 만든다(D4). 완료 확인: 콘솔에서 손으로 만든 `lineTops`와 앵커로 다음을 본다.
  - 앵커 위치에서는 두 함수가 서로의 역이다.
  - 같은 줄 앵커, 순서가 뒤집힌 앵커, 끝을 넘는 앵커가 버려진다.
  - `srcToPv(srcMax) === pvMax`, `srcToPv(0) === 0`이다.
  - 앵커가 없으면 비율 매핑이 된다.
- [x] 2.2 `src/lib/scroll-sync/measure.ts`에 mirror로 `lineTops`를 재는 함수와 미리보기 앵커를 재는 함수를 만든다(D3, D4). 완료 확인: 1280px에서 한글 긴 문단, 공백 없는 긴 URL, 탭 문자, 빈 줄이 섞인 노트를 연다. 원문을 스크롤해 아무 줄 N을 맨 위에 둔 뒤 콘솔에서 `lineAt(lineTops, textarea.scrollTop)`을 부르면 N(±0.5)이다. Chrome, Safari, Firefox에서 각각 확인한다.

## 3. 동기화 연결

- [x] 3.1 `src/lib/scroll-sync/scroll-sync.ts`에 `ScrollSync`를 만들고 기준 쪽 판정, 기대값 비교, rAF 전파, 화면에 그려진 쪽에만 전파하기를 넣는다(D5). `EditorPane.svelte`의 미리보기에 `bind:this`를 더하고 `ScrollSync`를 붙인다(D8). 완료 확인: 1280px에서 스펙 "넓은 화면의 양방향 스크롤 동기화", "내용 기준 위치 대응", "끝과 끝 맞춤", "애니메이션 없는 즉시 이동"의 시나리오를 손으로 확인한다. 휠, 스크롤바 드래그, 키보드(PageDown), 트랙패드 관성 스크롤에서 떨림이나 되먹임이 없다.
- [x] 3.2 재렌더와 리사이즈 다시 맞춤을 더한다(D6). 완료 확인:
  - 스펙 "내용과 크기가 바뀌어도 위치 유지"의 두 시나리오를 확인한다.
  - 서식 도구로 원문을 바꿔도 원문 영역의 스크롤 위치는 그대로다.
  - 사이드바 오버레이를 열고 닫거나 1100px ↔ 1440px를 오가도 두 영역이 같은 내용을 보인다.
- [x] 3.3 노트 전환 때 맨 위로 보내고, 1024px 미만 탭 전환 때 `capture()` → `restore()`를 연결한다(D6). 완료 확인:
  - 스펙 "노트를 열면 맨 위에서 시작"과 "좁은 화면의 탭 전환 시 위치 이어 주기"의 시나리오를 900px과 375px에서 확인한다.
  - 맨 아래에서 탭을 바꾸면 새 탭도 맨 아래다.
  - 탭을 바꿔도 포커스는 그대로다.
  - 900px에서 탭을 바꾼 뒤 창을 1280px로 넓히면 두 영역이 같은 내용을 보인다.
- [x] 3.4 미리보기 글자 선택 중 전파 중지를 더한다(D7). 완료 확인: 스펙 "미리보기 글자 선택 중 원문 고정" 시나리오를 확인한다. 미리보기의 링크를 눌러도 원문이 움직이지 않는다. 미리보기 스크롤바를 끌면 원문이 따라온다.

## 4. 통합 확인

- [x] 4.1 `specs/editor-scroll-sync/spec.md`의 모든 시나리오를 Chrome, Safari, Firefox 최신판에서 확인한다. 1280px은 동기화, 900px과 375px은 탭 전환을 본다. 함께 다음을 확인한다.
  - 5,000줄 노트에서 입력과 스크롤이 눈에 띄게 느려지지 않는다.
  - 빈 노트와 한 줄 노트에서 콘솔 오류가 없다.
  - `markdown-formatting`의 되돌리기와 단축키가 그대로 동작한다.
  - `pnpm check`가 통과한다.
  - 시나리오마다 통과하고, 실패하면 해당 작업으로 돌아간다. 브라우저별 결과를 PR 설명에 적는다.

## Workflow follow-up

- 구현과 확인이 끝나면 `/opsx:archive`로 보관해 `editor-scroll-sync` 스펙을 `openspec/specs/`에 반영한다.
