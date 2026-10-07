## 1. 디자인 계약

- [x] 1.1 `omd:remember`로 두 가지 교정을 `.omd/preferences.md`에 기록하고, `omd:learn`으로 System Graph에 합쳐 DESIGN.md를 다시 생성한다.
  - `note-card`: 검색 중 제목 하이라이트와 일치 발췌 스니펫(weak-background/weak-foreground, selected 카드에서는 canvas 배경)
  - `search-input`: `Esc`로 지우기, no-results 상태의 범위 밖 안내와 "전체 노트에서 보기"

  완료 확인: DESIGN.md "Components & States"의 `note-card` Anatomy에 발췌와 하이라이트가 있고, `.omd/system/manifest.json`의 해시가 새 projection과 맞는지 본다.

## 2. 검색용 텍스트와 일치 판정

- [x] 2.1 `render.ts`의 `collectBlocks`가 표 셀을 `cell` 블록으로 모으게 하고, `extractSearchText(tokens)`로 `{ title, body }`를 만든다. 대체 제목이면 `title`은 `''`다(D1). 완료 확인:
  - `pnpm check`가 통과한다.
  - 표·이미지·링크·코드 블록이 섞인 원문을 넣었을 때 표 셀 글자와 대체 텍스트가 `body`에 있고 링크 주소는 없는지 콘솔에서 본다.
  - 같은 원문에서 기존 `title`과 `snippet`이 바뀌지 않았는지 본다.
- [x] 2.2 `src/lib/search.ts`에 `fold`, `searchTerms`, `matches`, `highlightRanges`(fold 인덱스 → 원래 인덱스 대응, 구간 합치기)와 `excerpt`(앞 24자 규칙)를 순수 함수로 만든다(D2, D3, D4). 콘솔에서 확인할 것:
  - NFD `회의록`이 NFC 검색어와 일치한다.
  - `İstanbul`과 이모지가 섞인 줄에서 `<mark>` 구간이 맞는 글자에 걸린다.
  - `회의 회의록`의 구간이 하나로 합쳐진다.
  - `'  '`는 단어 0개다.
- [x] 2.3 `NoteDoc`에 `searchText`와 fold한 검색용 문자열을 `$derived`로 추가한다(D1, D2). 완료 확인: `pnpm check`가 통과하고, 노트 하나를 고쳐도 다른 노트의 파생값이 다시 계산되지 않는지(콘솔 로그를 잠깐 넣어서) 본다.

## 3. 검색 상태와 강제 상태 제거

- [x] 3.1 `ui.searchQuery`를 추가하고 `readForced`, `forced`, `FORCED_SEARCH_QUERY`, `Forced`를 지운다. `listEmptyShowsNewNote`에서 강제 조건을 뺀다(D5, D6). 완료 확인:
  - `pnpm check`가 통과한다.
  - `grep -rn "forced\|search=empty" src`의 결과가 없다.
  - `?search=empty`로 열어도 평소 화면이다.

## 4. 목록 필터링과 빈 상태

- [x] 4.1 `NoteList`에서 `SearchInput`을 `ui.searchQuery`에 묶고, 범위 필터 뒤에 `matches` 필터를 건다. 정렬과 선택 노트 위치 고정은 그대로다. 완료 확인:
  - "업무" 폴더에서 `예산`을 넣으면 폴더 안의 일치 노트만 최근 수정 순으로 남는다.
  - 목록 제목과 사이드바 개수는 그대로다.
  - 한글 입력기로 조합하는 중에도 목록이 바뀐다.
- [x] 4.2 빈 상태 분기에 검색 결과 없음을 D5 순서로 넣는다. 범위 밖 일치 개수와 "전체 노트에서 보기" 버튼도 넣고, 태그 칩과 공통인 범위 전환 후 제목 포커스 함수로 정리한다. 완료 확인:
  - 빈 폴더에서 검색하면 빈 폴더 상태가 나온다.
  - "업무"에서 다른 곳에만 있는 단어를 검색하면 개수와 버튼이 나온다.
  - 버튼을 누르면 "전체 노트"로 바뀌고, 검색어가 남고, 포커스가 목록 제목에 있다.
  - "전체 노트"에서는 버튼이 없다.
  - 검색 결과 없음일 때 에디터 빈 상태의 "새 노트" 버튼 규칙이 그대로인지 1280px에서 본다.

## 5. 결과 카드

- [x] 5.1 `NoteCard`가 검색 중에 받는 제목·발췌 조각을 `<mark>`로 그린다. 발췌가 없으면 원래 스니펫을 쓰고, selected 카드의 `<mark>`는 canvas 배경을 쓴다(D4). 완료 확인:
  - 본문 다섯 번째 문단에만 일치가 있는 노트에서 발췌가 `…`로 시작하고 일치 부분이 두 줄 안에 보인다.
  - 제목에만 일치하면 제목만 하이라이트된다.
  - selected 카드에서 하이라이트가 구분된다.
  - 검색어를 지우면 원래 카드로 돌아온다.
  - VoiceOver가 카드 제목을 `<mark>` 없이 이어서 읽는다.

## 6. 단축키와 Esc

- [x] 6.1 `SearchInput`에서 "뼈대 단계" 주석을 지우고 입력에 `id="note-search-input"`을 준다. `Esc`로 지우기를 넣되 조합 중에는 무시한다(D7). 완료 확인: `예산`이 들어 있을 때 `Esc`를 누르면 비워지고, 한글 조합 중 `Esc`는 조합만 취소되는지 본다.
- [x] 6.2 `App.svelte`에 `Cmd/Ctrl+K` 처리를 D7 순서대로 넣는다(모달 확인 → 오버레이 닫기 → 좁은 폭 상세에서 목록으로 → 포커스와 전체 선택). 완료 확인:
  - 1280px에서 원문 입력 중에 누르면 검색으로 가고 원문에 글자가 들어가지 않는다.
  - 900px에서 사이드바 오버레이가 열린 채로 누르면 오버레이가 닫히고 검색으로 간다.
  - 375px 상세에서 누르면 목록이 보이고 검색에 포커스가 있다.
  - 삭제 확인 다이얼로그가 열려 있으면 아무 일도 없다.

## 7. 통합 확인

- [x] 7.1 `specs/note-search/spec.md`의 모든 시나리오와 수정된 `note-ui-skeleton` 시나리오를 1280px, 900px, 375px에서 손으로 확인한다. 완료 확인: 시나리오마다 통과하는지 보고, 실패하면 해당 작업으로 돌아간다.
- [ ] 7.2 성능을 확인한다. DevTools 콘솔에서 긴 노트 500개를 저장소에 만들고 검색어를 한 글자씩 입력하며 Performance 패널로 입력 지연을 잰다. 완료 확인: 첫 입력과 이후 입력의 한 프레임 처리 시간을 PR 설명에 적는다. 100ms를 넘으면 design.md Risks를 다시 검토한다.
- [x] 7.3 접근성과 모션을 확인한다.
  - 키보드만으로 검색 입력, 지우기 버튼, "전체 노트에서 보기"를 쓸 수 있고 포커스 링이 보인다.
  - 하이라이트 글자 대비가 4.5:1 이상이다(weak-foreground on weak-background, weak-foreground on canvas).
  - 320px와 200% 확대에서 발췌에 가로 스크롤이 없다.

  완료 확인: 확인 결과를 PR 설명에 적는다.
- [x] 7.4 `pnpm check`와 `pnpm build`를 통과시킨다. 완료 확인: 두 명령이 오류 없이 끝난다.
