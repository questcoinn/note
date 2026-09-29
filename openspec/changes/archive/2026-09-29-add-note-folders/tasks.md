## 1. 디자인 계약

- [x] 1.1 D9의 새 컴포넌트(폴더 메뉴, 에디터 폴더 선택, 이름 입력 text-field, "폴더 없음" 고정 항목)를 oh-my-design 절차로 System Graph에 추가하고 DESIGN.md를 다시 생성한다 — DESIGN.md "Components & States"에 네 항목이 state applicability와 함께 있고, `.omd/system/manifest.json`의 해시가 새 projection과 맞는지 확인
- [x] 1.2 D7의 anchor positioning과 `popover` 지원 범위를 modern-web-guidance로 확인하고 대체 위치 방식을 정한다 — 확인 결과를 design.md D7에 한 줄로 반영

## 2. 폴더 저장 계층

- [x] 2.1 `store.ts`에 `FolderRecord`, `FolderStore`, `isFolderRecord`를 추가한다(D1) — `pnpm check` 통과
- [x] 2.2 `LocalStorageStore`가 `FolderStore`를 구현한다(`folder:v1:` 접두사, 키·id 불일치와 손상 항목 건너뛰기) — DevTools에서 `folder:v1:x`에 깨진 JSON을 넣고 새로고침해도 앱이 뜨고 그 키가 그대로인지 확인
- [x] 2.3 `main.ts`가 노트와 폴더를 따로 불러오고 한쪽 실패가 다른 쪽을 막지 않게 한다 — 폴더 키만 손상된 상태에서 노트가 모두 보이는지 확인
- [x] 2.4 `AutosaveController`에 `saveNow(id): Promise<boolean>`을 추가한다(D5). 진행 중·후속 쓰기가 끝날 때까지 기다리고 최종 성공 여부를 돌려준다 — `pnpm check` 통과, 5.3에서 동작 확인

## 3. 폴더와 노트 상태

- [x] 3.1 `src/lib/folders.svelte.ts`를 만든다: `folders`, `folderById`, 가나다순 `sortedFolders`, `validateFolderName`(빈 이름·중복·예약어), `createFolder`, `renameFolder`(D2). 저장 실패 시 메모리를 바꾸지 않고 throw — `pnpm check` 통과
- [x] 3.2 `NoteDoc.folderId`를 `$state`로 바꾸고 `effectiveFolderId` 파생값을 추가한다(D3). `createNote(folderId)`가 범위의 폴더를 받게 한다 — `work` 폴더 값을 가진 예시 노트가 저장된 브라우저에서 편집 후 저장해도 저장본 `folderId`가 `work`인지 DevTools로 확인
- [x] 3.3 `moveNote(note, folderId)`를 D4대로 구현한다(수정 시각 유지, draft는 기록 안 함, schedule 후 flush) — 폴더를 바꾼 직후 새로고침하면 바뀐 폴더가 남고 `updatedAt`이 그대로인지 확인
- [x] 3.4 `deleteFolder(id)`를 D5 순서대로 구현한다(노트 이동·`saveNow` 대기 → 하나라도 실패하면 throw → 폴더 remove → 보던 범위면 `all`) — 5.3에서 확인
- [x] 3.5 `ui-state.svelte.ts`에 `ui.scope`, `selectScope()`, 범위 판정 함수를 추가하고 `startNewNote()`가 범위의 폴더로 노트를 만들게 한다. `selectScope()`는 `selectNote()`를 부르지 않는다 — "업무"를 보며 "새 노트"를 누르면 폴더 선택에 "업무"가 보이는지 확인(4.x 이후)

## 4. 사이드바

- [x] 4.1 `SidebarNavItem`에 `onclick`과 선택적 메뉴 버튼 영역을 추가하고, "뼈대 단계" 주석을 지운다(D7) — 키보드로 항목을 누르면 범위가 바뀌는지 확인
- [x] 4.2 `Sidebar`에 "폴더 없음" 고정 항목, "폴더" 그룹 제목(h3 역할)과 만들기 버튼, 가나다순 폴더 항목, 범위별 개수와 active 표시를 추가한다(D8). 필요한 아이콘을 `Icon`에 추가한다 — 1280px에서 개수가 노트 만들기·삭제·폴더 이동에 즉시 반응하고, 0개 항목도 보이는지 확인
- [x] 4.3 오버레이(1024px 미만)에서 범위 항목을 누르면 닫히고 목록 제목에 포커스가 가게 한다 — 375px와 900px에서 확인
- [x] 4.4 폴더 메뉴 컴포넌트를 만든다(`popover`, `role="menu"`, 화살표 이동, Esc·바깥 클릭 닫기와 포커스 반환, 삭제 항목 danger 색) — 키보드만으로 열고 이동하고 닫을 수 있고, VoiceOver가 "업무 폴더 메뉴"를 읽는지 확인

## 5. 폴더 다이얼로그

- [x] 5.1 `FolderNameDialog.svelte`를 만든다(D6: 입력 포커스, Enter 제출, 규칙 오류 `aria-invalid`·`aria-describedby`, 저장 실패 `role="alert"`) — `pnpm check` 통과
- [x] 5.2 만들기와 이름 바꾸기를 연결하고 D6의 포커스 반환을 구현한다 — 빈 이름·중복·"폴더 없음"이 각각 거부 문구를 보이고, 만들기 뒤 새 항목에, 이름 바꾸기 뒤 메뉴 버튼에 포커스가 가는지, 보던 폴더의 이름을 바꾸면 목록 제목도 바뀌는지 확인
- [x] 5.3 폴더 삭제를 `ConfirmDialog`로 연결한다(노트 수에 따른 설명, 실패 문구, 포커스 반환) — 보던 폴더를 지우면 "전체 노트"로 가고 목록 제목에 포커스가 가는지, 수정 시각 문구가 그대로인지 확인. DevTools에서 `localStorage.setItem`이 예외를 던지게 바꾸고 삭제하면 다이얼로그에 실패 문구가 보이고 폴더와 노트가 모두 남는지, 되돌린 뒤 다시 누르면 성공하는지 확인

## 6. 목록과 에디터

- [x] 6.1 `NoteList`가 범위로 필터링하고 제목을 범위 이름(말줄임)으로 보이게 한다. 정렬·위치 고정은 범위 안에서 그대로 둔다 — "업무"를 누르면 업무 노트만 보이고, 범위 밖 노트가 열려 있으면 selected 카드가 없는지 확인
- [x] 6.2 범위별 빈 상태(빈 폴더 + "새 노트", 폴더 없음 노트 없음, 노트 없음)를 추가하고 `?search=empty`가 우선하게 한다. 에디터 빈 상태의 "새 노트" 버튼은 목록 빈 상태에 버튼이 있을 때 숨긴다 — 세 경우를 1280px에서 확인
- [x] 6.3 `EditorPane` 헤더에 폴더 `<select>`("폴더 없음" + 가나다순 폴더, 라벨 "폴더")를 추가하고 `moveNote`에 연결한다 — 좁혀진 목록에서 다른 폴더로 옮기면 카드가 빠지고 에디터와 포커스가 그대로이며 저장 상태가 "저장 중"을 거쳐 "저장됨"이 되는지, 320px에서 헤더가 가로 스크롤 없이 줄바꿈되는지 확인

## 7. 검증

- [x] 7.1 `pnpm check`와 `pnpm build`가 경고 없이 통과한다
- [x] 7.2 세 델타 스펙(`note-folders`, `note-ui-skeleton`, `note-persistence`)의 시나리오를 1280px, 900px, 375px, 320px에서 차례로 확인하고, 네트워크 요청이 없는지와 200% 확대에서 콘텐츠가 잘리지 않는지 본다
- [x] 7.3 키보드만으로 폴더 만들기, 범위 바꾸기, 노트 옮기기, 이름 바꾸기, 삭제, 취소가 되는지 확인한다. 모든 버튼에 포커스 링이 보이고 다이얼로그·메뉴를 닫은 뒤 포커스가 D6에서 정한 자리에 가야 한다
- [x] 7.4 omd-designer-review로 새 사이드바·메뉴·다이얼로그·폴더 선택을 DESIGN.md 대비 검토하고 BLOCK 항목을 고친다
