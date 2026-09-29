## Context

- 저장 형식 v1의 `NoteRecord`에는 이미 `folderId: string`이 있다. 새 노트는 `''`로 기록되고, 예전 목업이 기록한 노트는 `work`·`personal` 같은 id를 갖는다. 폴더 자체를 저장하는 곳은 없다.
- `NoteDoc.folderId`는 `readonly`이고, 화면은 이 값을 읽지 않는다. `NoteList`는 `notes` 전체를 정렬만 해서 보여주며 제목이 "전체 노트"로 고정되어 있다.
- `SidebarNavItem`은 folder·tag·all-notes 변형과 active 스타일을 갖췄지만 누르는 동작이 없다.
- 자동 저장(`AutosaveController`)은 노트당 쓰기를 하나씩 직렬화하고 스냅샷을 `NoteDoc.toRecordFormat()`에서 얻는다. `flush()`는 결과를 기다릴 수 없다.
- `ConfirmDialog`는 `<dialog>.showModal()`로 포커스 가두기와 Esc를 처리하고, 실패 문구 영역(`role="alert"`)을 갖고 있다.
- 선택 변경은 모두 `selectNote()`를 거친다(떠나는 노트 flush, 기록 전 새 노트 정리, 정렬 고정).

## Goals / Non-Goals

**Goals:**
- 폴더 데이터를 노트와 같은 저장 계층 원칙(비동기 인터페이스, 손상 항목 건너뛰기) 위에 둔다.
- 노트의 소속 변경이 노트 레코드의 쓰기 직렬화를 거치게 해, 폴더 이동과 원문 저장이 서로를 덮어쓰지 않게 한다.
- 폴더 삭제가 어느 단계에서 실패해도 노트를 잃지 않게 한다.

**Non-Goals:**
- 여러 탭 사이의 폴더 동기화. 다른 탭에서 만든 폴더는 새로고침해야 보인다.
- 폴더 레코드 형식에 순서, 색, 아이콘 같은 필드를 미리 넣는 것.
- 폴더와 노트를 한 번에 쓰는 트랜잭션.

## Decisions

### D1. 폴더는 별도 레코드와 별도 저장소 인터페이스로

```
 key: folder:v1:<id>
 FolderRecord = { schema: 1, id: string, name: string }

 interface FolderStore {
   loadAllFolders(): Promise<FolderRecord[]>   // 손상·모르는 형식은 건너뜀, 고치지 않음
   putFolder(folder): Promise<void>            // 실패하면 reject
   removeFolder(id): Promise<void>
 }
```

- `LocalStorageStore`가 `NoteStore`와 `FolderStore`를 함께 구현한다(그래서 메서드 이름이 겹치지 않게 한다). 키 접두사가 달라 `note:v1:` 순회와 섞이지 않는다.
- 이름 규칙(공백 제거, 중복, 예약어)은 저장소가 아니라 폴더 상태 모듈에서 검사한다. 저장소는 형식만 본다.
- `main.ts`는 노트와 폴더를 따로 불러오고, 한쪽이 실패해도 다른 쪽은 쓴다. 폴더를 못 읽으면 폴더 없이 시작하고, 노트는 모두 "폴더 없음"으로 보인다(D3).
- 대안: `NoteStore`에 폴더 메서드를 추가. 인터페이스 하나가 두 종류의 레코드를 알게 되고, 손상 규칙 테스트가 섞여서 기각했다.
- 대안: 폴더 목록 전체를 키 하나에 저장. 폴더 하나가 손상되면 전부 잃고, "손상 항목만 건너뛴다" 원칙을 지킬 수 없어서 기각했다.

### D2. 폴더 상태 모듈과 목록 범위

- 새 `src/lib/folders.svelte.ts`: `folders`(반응형 배열, 가나다순 파생 `sortedFolders`), `folderById`, `createFolder(name)`, `renameFolder(id, name)`, `deleteFolder(id)`, `validateFolderName(name, exceptId?)`.
- 정렬은 `localeCompare(b, 'ko')`. 동률(대소문자만 다름)은 중복 규칙상 생기지 않는다.
- 중복 검사는 `trim()` 뒤 `toLocaleLowerCase('ko')` 비교. 예약어는 "전체 노트", "폴더 없음".
- `ui-state.svelte.ts`에 `ui.scope: { kind: 'all' } | { kind: 'unfiled' } | { kind: 'folder', id }`를 둔다. 새로고침하면 `all`로 시작한다.
- `selectScope(scope)`는 범위만 바꾸고 `selectNote()`를 부르지 않는다. 열린 노트를 닫지 않는다는 결정(사용자 결정 D)을 코드 경로에서 보장하는 방법이다.
- `NoteList`는 `scopedNotes = notes.filter(inScope)`를 정렬한다. selected 카드는 `ui.selectedNoteId`가 범위 안에 있을 때만 생긴다.

### D3. 모르는 폴더 id는 읽을 때 "폴더 없음"으로

- `NoteDoc`에 `effectiveFolderId = $derived(folderById.has(this.folderId) ? this.folderId : '')`를 둔다. 범위 필터, 개수, 에디터 선택은 모두 이 값을 쓴다.
- 저장본의 `folderId`(원래 값)는 `toRecordFormat()`이 그대로 쓴다. 사용자가 폴더 선택을 바꿀 때만 값이 바뀐다.
- 대안: 불러올 때 메모리 값을 `''`로 정규화해 다음 저장에서 고침. 폴더 레코드가 손상되어 건너뛰어진 경우까지 노트의 소속을 영구히 지우게 되어 "건너뛴 항목은 덮어쓰지 않는다" 원칙과 부딪혀 기각했다(탐색 중 제안했던 기본값을 이 이유로 바꿈).
- 폴더를 지울 때(D5)는 해당 id를 가진 노트의 `folderId`를 실제로 `''`로 바꿔 기록한다. 지운 폴더 id가 저장본에 남으면, 같은 id가 다시 생길 일은 없지만 데이터가 설명과 어긋나기 때문이다.

### D4. 노트 폴더 바꾸기는 자동 저장을 거친다

```
 moveNote(note, folderId)
   note.folderId = folderId        // $state로 변경. updatedAt은 건드리지 않음
   if note.draft: return           // 기록 전 새 노트는 기록하지 않음
   autosave.schedule(id); autosave.flush(id)
```

- `NoteDoc.folderId`를 `$state`로 바꾼다. `markEdited()`는 쓰지 않는다(수정 시각 유지, 사용자 결정 F).
- `schedule` 후 `flush`로 대기 없이 쓰되, 이미 쓰는 중이면 기존 `dirtyDuringWrite`/`flushAfterWrite` 경로가 다음 쓰기에 새 폴더를 반영한다. 원문 저장과 폴더 저장이 같은 스냅샷 함수를 쓰므로 서로를 덮어쓰지 않는다.
- 저장 상태 표시는 기존 전이 그대로 "저장 중"을 거쳐 "저장됨"이 된다.
- 기록 전 새 노트는 메모리에서만 바뀌고, 첫 기록 때 `toRecordFormat()`이 그 폴더를 싣는다. 새 노트를 만들 때 `createNote(folderId)`가 범위의 폴더를 받는다.
- 에디터의 컨트롤은 네이티브 `<select>`(`aria-label` 대신 시각적 라벨 "폴더" 또는 `<label>` 연결). 키보드·스크린리더·모바일 피커를 그대로 얻는다.

### D5. 폴더 삭제 순서: 노트를 먼저 옮기고 폴더를 나중에 지운다

```
 deleteFolder(id)
   targets = notes where folderId === id
   for each target: target.folderId = ''         (메모리)
   results = await Promise.all(targets.filter(!draft).map(saveNow))
   if any failed: throw                          (폴더 레코드 남김)
   await folderStore.remove(id)                  (실패하면 throw)
   remove from folders; if ui.scope is this folder: scope = all
```

- `AutosaveController`에 `saveNow(id): Promise<boolean>`을 추가한다. `flush`와 같은 경로로 쓰되 진행 중·후속 쓰기가 끝날 때까지 기다리고 최종 성공 여부를 돌려준다. `cancel()`이 `inFlight`를 기다리는 방식과 같은 원리다.
- 실패 시 이미 성공한 노트는 "폴더 없음"에 남고, 실패한 노트는 메모리에서 "폴더 없음"이며 저장 상태가 "저장 안 됨"이 된다. 기존 쓰기 실패 규칙대로 재시도된다. 폴더가 남아 있으니 다시 "삭제"를 누르면 남은 노트만 옮긴다. 저장에 실패한 노트는 메모리 값이 이미 `''`라 `folderId`로 다시 찾을 수 없으므로, 폴더별로 실패한 노트 id를 기억해 두었다가 재시도에 포함한다(구현 중 발견).
- 실패한 노트의 메모리 값을 되돌리지 않는다. 되돌리면 이미 대기 중인 원문 저장과 뒤섞여 어느 값이 기록될지 예측하기 어려워진다. 새로고침하면 저장본대로 원래 폴더에 돌아가고, 폴더가 남아 있으므로 데이터와 설명이 맞는다.
- 대안: 폴더를 먼저 지우고 노트를 나중에 옮김. 중간에 실패하면 노트가 존재하지 않는 폴더를 가리키게 된다. D3 덕분에 화면은 "폴더 없음"으로 보이겠지만, 실패 문구("삭제하지 못했어요")와 실제 상태(폴더는 지워짐)가 어긋나서 기각했다.

### D6. 이름 입력 다이얼로그는 ConfirmDialog와 같은 모달 골격

- 새 `FolderNameDialog.svelte`: `<dialog>.showModal()`, `<form method="dialog">` 대신 `onsubmit` 처리(Enter 제출), 라벨 "폴더 이름" 입력, 규칙 오류는 입력 아래 `aria-describedby` + `aria-invalid`, 저장 실패는 `role="alert"` 영역. 버튼 "취소" / "만들기" 또는 "저장".
- 이름 규칙 오류 문구: 빈 이름 "폴더 이름을 입력해 주세요", 중복 "같은 이름의 폴더가 있어요", 예약어 "이 이름은 쓸 수 없어요". 저장 실패 "폴더를 저장하지 못했어요. 다시 시도해 주세요."
- 폴더 삭제는 기존 `ConfirmDialog`를 쓴다. 제목 "'업무' 폴더를 삭제할까요?", 설명은 노트가 있으면 "안에 있는 노트 N개는 지워지지 않고 '폴더 없음'으로 옮겨져요.", 없으면 "이 폴더에는 노트가 없어요." 실패 "폴더를 삭제하지 못했어요. 다시 시도해 주세요." 최종 문구는 구현 단계에서 microcopy 검토를 거친다.
- 포커스 반환: 만들기 성공 → 새 폴더 항목, 취소 → 만들기 버튼, 이름 바꾸기 → 그 폴더의 메뉴 버튼, 삭제(보던 폴더) → 목록 제목, 삭제(다른 범위) → 만들기 버튼. 목록 제목은 이미 `tabindex="-1"`로 노트 삭제 후 포커스를 받는다.
- 좁은 화면에서 사이드바 오버레이 위에 다이얼로그가 열린다. 모달이 최상위 레이어라 z-index 조정이 필요 없다. 다이얼로그를 닫아도 오버레이는 열린 채로 둔다.

### D7. 폴더 메뉴는 popover 기반 메뉴 버튼

- 폴더 항목을 `[이름·개수 버튼][메뉴 버튼]` 두 형제 버튼으로 나눈다. 버튼 안에 버튼을 넣을 수 없기 때문이다. `SidebarNavItem`에 `onclick`과 선택적 메뉴 slot을 추가하고, 메뉴가 있는 행은 hover 배경을 행 전체에 준다.
- 메뉴 버튼: `aria-label="업무 폴더 메뉴"`, `aria-haspopup="menu"`, `aria-expanded`. 메뉴는 `popover="auto"`로 바깥 클릭·Esc 닫기를 브라우저에 맡기고, `role="menu"`/`menuitem`, 위아래 화살표 이동, 열면 첫 항목 포커스, 닫히면 메뉴 버튼으로 포커스.
- 위치는 CSS anchor positioning 대신 JS로 계산한다. 메뉴가 열릴 때(`toggle` 이벤트) 메뉴 버튼의 `getBoundingClientRect()`로 `position: fixed` 좌표를 정하고, 아래 공간이 모자라면 위로 연다. modern-web-guidance 확인 결과(1.2): anchor positioning은 Chrome·Edge·Firefox 미지원이라 폴리필 없이 쓸 수 없고, Popover는 Baseline Newly available(2025-01)이다. 사용자 결정으로 Popover는 폴리필 없이 쓰고 미지원 브라우저는 지원 범위 밖으로 둔다(CLAUDE.md "Browser support").
- "삭제" 항목은 `color.danger` 텍스트. 메뉴 표면은 테두리 없이 `color.canvas` 배경에 `color.border` 경계(DESIGN.md "표면을 구분한다"), 그림자 없음.

### D8. 사이드바 레이아웃

```
 노트                         [x]
 [ + 새 노트 ]
 [=] 전체 노트            8
 [ ] 폴더 없음            2
 폴더                     [+]      <- h3 역할(24px, preferences 반영), 버튼 aria-label "새 폴더"
 [F] 개인            3   [..]
 [F] 업무            3   [..]
```

- "폴더 없음" 아이콘은 `inbox` 계열을 새로 추가한다(없으면 Icon에 SVG 추가). `sidebar-nav-item`의 variant를 늘리지 않고 all-notes와 같은 고정 항목으로 다룬다.
- `nav`의 `aria-label`은 "노트 탐색" 그대로. 목록 제목은 `h2`에 범위 이름을 넣고 긴 이름은 말줄임한다.

### D9. 디자인 계약 반영

- DESIGN.md에 없는 것: 폴더 메뉴(menu), 에디터 폴더 선택(select), 이름 입력 다이얼로그의 text-field, "폴더 없음" 고정 항목. 구현 작업 첫 단계에서 oh-my-design 절차로 System Graph에 추가하고 DESIGN.md를 다시 생성한다. 이 change의 artifact에서 DESIGN.md를 직접 고치지 않는다.

## Risks / Trade-offs

- [열린 노트가 목록 범위 밖에 있는 상태가 자주 생김] → 사용자 결정. 에디터의 폴더 선택이 소속을 보여주어 이유를 설명한다. selected 카드가 없어도 에디터가 기준이 된다.
- [폴더 삭제 중 일부 노트 저장 실패] → D5. 노트는 잃지 않고, 폴더가 남아 재시도할 수 있다. 메모리와 저장본이 잠시 어긋나지만 새로고침하면 저장본 기준으로 일관된다.
- [다른 탭에서 같은 폴더를 지우거나 이름을 바꿈] → 여러 탭 동기화는 범위 밖. 이 탭은 새로고침 전까지 옛 폴더를 보여주고, 그 폴더로 옮긴 노트는 다른 탭에서 "폴더 없음"으로 보인다(D3).
- [폴더 레코드 손상으로 노트가 "폴더 없음"으로 보임] → 저장본을 고치지 않으므로 데이터가 복구되면 원래 폴더로 돌아간다.
- [좁은 폭(320px) 에디터 헤더에 폴더 선택이 추가됨] → 헤더 줄바꿈을 허용하고, select 폭은 내용에 맞추되 최대 폭을 둔다. 320px과 200% 확대에서 확인한다.
- [anchor positioning 미지원 브라우저] → D7 대체 위치.

## Migration Plan

- 노트 레코드 형식이 같아 이관 작업이 없다. 폴더 키는 새로 생긴다.
- 예전 목업 노트는 `work` 등의 폴더 값을 가진 채 "폴더 없음"으로 보인다. 사용자가 이름이 같은 폴더를 새로 만들어도 id가 달라 자동으로 합쳐지지 않는다.
- 되돌리면 이전 버전은 `folder:v1:` 키를 무시하고 폴더 값을 화면에서 쓰지 않는다. 폴더를 지우며 `''`로 바꾼 노트는 그대로 `''`다.
