## 1. 의존성과 렌더 모듈

- [x] 1.1 `pnpm add markdown-it dompurify`를 실행하고(markdown-it 15는 자체 타입을 포함하므로 `@types/markdown-it`는 설치하지 않음), `package.json`의 `dependencies`에 두 패키지가 들어갔는지와 `pnpm check` 통과를 확인
- [x] 1.2 `src/lib/markdown/render.ts`에 D4 설정의 markdown-it 인스턴스와 `parse`, `renderHtml` 작성. `renderHtml`은 D6의 DOMPurify 정화와 링크 훅을 포함 — 임시 호출로 `<script>` 원문이 이스케이프되고 `[x](javascript:alert(1))`가 링크가 되지 않으며, 일반 링크에 `target="_blank" rel="noopener noreferrer"`가 붙는지 확인 후 임시 코드 제거
- [x] 1.3 D5의 이미지 렌더러와 표 래퍼 렌더러 추가 — `![구조도](https://example.com/a.png)` 결과에 `<img>`가 없고 "이미지: 구조도"가 있으며, 표가 `div.table-scroll`로 감싸지는지 확인
- [x] 1.4 D5의 `task-list` core 규칙 작성 — `- [ ] a`, `- [x] b`, `- [X] c`, `- 일반`, `1. [ ] d` 결과에서 앞의 네 체크박스는 disabled에 알맞은 checked 상태와 `aria-label`을 갖고, 일반 항목은 그대로인지 확인
- [x] 1.5 D7의 블록 수집, 줄 단위 평문화, `extractTitleAndSnippet` 작성(미리보기 문장이 제목 위치를 알아야 해서 제목·미리보기 문장 추출을 한 함수로 합침) — 스펙 "제목과 미리보기 문장 파생"의 시나리오 8개 입력(여러 줄 문단, 한 줄짜리 문단, 목록으로 시작, 제목·코드 블록 건너뛰기, 빈 원문 포함)으로 기대값이 모두 나오는지 확인

## 2. 노트 상태 전환

- [x] 2.1 `mock/data.ts`의 노트 타입을 `NoteSeed`(id, folderId, tagIds, updatedLabel, source)로 줄이고 `previewHtml`, `snippet`, `title` 필드와 값을 삭제. 파일 상단 주석도 갱신 — `rg 'previewHtml|snippet:' src/lib/mock`로 결과 없음 확인
- [x] 2.2 `src/lib/notes.svelte.ts`에 D2의 `NoteDoc` 클래스, `notes`, `noteById` 작성 — `pnpm check` 통과
- [x] 2.3 `ui-state.svelte.ts`의 `forced.save`를 `SaveStatus | null`로 바꾸고 파일 상단 주석에서 "노트 데이터는 상수" 설명 수정 — `pnpm check` 통과
- [x] 2.4 `NoteList`, `Sidebar`, `NoteCard`가 `notes.svelte`의 `notes`와 `NoteDoc` 타입을 쓰도록 바꾸고, `NoteCard`는 `snippet`이 빈 문자열이면 미리보기 문장 요소를 렌더하지 않게 수정 — 1280px에서 카드 7개의 제목이 변경 전과 같은지 확인

## 3. 에디터

- [x] 3.1 `EditorPane`의 원문 textarea를 D3대로 `bind:value` + `oninput`에서 dirty 설정으로 바꾸고 `{#key}` 제거, 미리보기를 `{@html note.html}`로 교체, 기존 sanitize 경고 주석을 현재 구조에 맞게 수정 — 원문 끝에 `## 새 섹션`을 입력하면 미리보기에 h2가 나타나는지 확인
- [x] 3.2 저장 상태를 `forced.save ?? (note.dirty ? 'unsaved' : 'saved')`로 연결 — 스펙 "편집하면 저장 안 됨" 시나리오(A 편집 → B 열기 → A 다시 열기)와 `?save=saving` 강제 변형 확인
- [x] 3.3 D8의 미리보기 스타일 추가 — 표, 구분선, 취소선, 굵게, h5/h6, 체크박스, 이미지 대체 텍스트를 모두 담은 원문을 임시로 입력해 1280px과 375px에서 확인하고, 좁은 폭에서 넓은 표가 표 영역 안에서만 가로 스크롤되는지 확인
- [x] 3.4 `rg '#[0-9a-fA-F]{3,6}' src/lib`로 새 스타일에 원시 색상값이 없는지 확인

## 4. 검증

- [x] 4.1 `pnpm check`와 `pnpm build`가 경고/오류 없이 통과
- [x] 4.2 `specs/markdown-preview/spec.md`의 모든 시나리오를 1280px에서, "좁은 폭에서 탭 전환" 시나리오는 900px에서 브라우저로 확인
- [x] 4.3 `specs/note-ui-skeleton/spec.md` 델타의 시나리오를 확인. 원문을 고쳐도 목록 순서, 수정 시각 문구, 사이드바 개수가 그대로인지 포함
- [x] 4.4 DevTools 네트워크 탭에서 이미지 문법 입력과 전체 UI 조작 중 외부 요청이 없고, Application 탭에서 저장소 쓰기가 없는지 확인 (기존 "외부 요청 없음" 시나리오 유지)
- [x] 4.5 새로고침하면 편집 내용이 목업 초기값으로 돌아가고 모든 노트가 "저장됨"으로 보이는지 확인
