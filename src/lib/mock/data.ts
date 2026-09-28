// 뼈대 단계용 정적 목업 데이터. count, snippet, updatedLabel은 파생하지 않고 직접 적는다.

export type Folder = { id: string; name: string; count: number }
export type Tag = { id: string; name: string; count: number }
export type Note = {
  id: string
  title: string
  folderId: string
  tagIds: string[]
  snippet: string
  updatedLabel: string
  source: string
  previewHtml: string
}

export const folders: Folder[] = [
  { id: 'work', name: '업무', count: 4 },
  { id: 'personal', name: '개인', count: 3 },
  { id: 'archive', name: '보관함', count: 0 },
]

export const EMPTY_FOLDER_ID = 'archive'

export const tags: Tag[] = [
  { id: 'idea', name: '아이디어', count: 1 },
  { id: 'meeting', name: '회의', count: 2 },
  { id: 'reading', name: '읽을거리', count: 1 },
  { id: 'todo', name: '할일', count: 3 },
  { id: 'dev', name: '개발', count: 2 },
]

export const notes: Note[] = [
  {
    id: 'n1',
    title: '3분기 제품 회의록',
    folderId: 'work',
    tagIds: ['meeting', 'todo'],
    snippet: '검색 개선을 이번 분기 최우선으로 두고, 태그 필터는 다음 분기로 넘기기로 했어요.',
    updatedLabel: '3분 전',
    source: `# 3분기 제품 회의록

검색 개선을 이번 분기 최우선으로 두고, 태그 필터는 다음 분기로 넘기기로 했어요.

## 결정 사항

- 검색 결과 없음 문구를 명확하게 바꾸기
- 저장 상태를 에디터 상단에 항상 표시
- 태그 필터는 4분기로 이동

> 사용자는 쓰는 것보다 다시 읽는 일이 더 많다.

## 다음 할 일

1. 검색 화면 시안 공유
2. 저장 상태 문구 검토
`,
    previewHtml: `<h1>3분기 제품 회의록</h1>
<p>검색 개선을 이번 분기 최우선으로 두고, 태그 필터는 다음 분기로 넘기기로 했어요.</p>
<h2>결정 사항</h2>
<ul>
<li>검색 결과 없음 문구를 명확하게 바꾸기</li>
<li>저장 상태를 에디터 상단에 항상 표시</li>
<li>태그 필터는 4분기로 이동</li>
</ul>
<blockquote><p>사용자는 쓰는 것보다 다시 읽는 일이 더 많다.</p></blockquote>
<h2>다음 할 일</h2>
<ol>
<li>검색 화면 시안 공유</li>
<li>저장 상태 문구 검토</li>
</ol>`,
  },
  {
    id: 'n2',
    title: '마크다운 단축키 정리',
    folderId: 'work',
    tagIds: ['dev'],
    snippet: '자주 쓰는 서식은 단축키로 바로 넣을 수 있어요. 굵게는 Cmd+B, 기울임은 Cmd+I.',
    updatedLabel: '1시간 전',
    source: `# 마크다운 단축키 정리

자주 쓰는 서식은 단축키로 바로 넣을 수 있어요.

- 굵게: \`Cmd+B\` → \`**텍스트**\`
- 기울임: \`Cmd+I\` → \`*텍스트*\`
- 링크: \`Cmd+K\` → \`[텍스트](주소)\`

## 코드 블록

\`\`\`ts
function toggleBold(text: string) {
  return \`**\${text}**\`
}
\`\`\`
`,
    previewHtml: `<h1>마크다운 단축키 정리</h1>
<p>자주 쓰는 서식은 단축키로 바로 넣을 수 있어요.</p>
<ul>
<li>굵게: <code>Cmd+B</code> → <code>**텍스트**</code></li>
<li>기울임: <code>Cmd+I</code> → <code>*텍스트*</code></li>
<li>링크: <code>Cmd+K</code> → <code>[텍스트](주소)</code></li>
</ul>
<h2>코드 블록</h2>
<pre><code>function toggleBold(text: string) {
  return \`**\${text}**\`
}</code></pre>`,
  },
  {
    id: 'n3',
    title: '주말 장보기',
    folderId: 'personal',
    tagIds: ['todo'],
    snippet: '우유, 달걀, 사과, 커피 원두. 원두는 지난번과 같은 걸로.',
    updatedLabel: '어제',
    source: `# 주말 장보기

- 우유
- 달걀 한 판
- 사과
- 커피 원두 (지난번과 같은 걸로)
`,
    previewHtml: `<h1>주말 장보기</h1>
<ul>
<li>우유</li>
<li>달걀 한 판</li>
<li>사과</li>
<li>커피 원두 (지난번과 같은 걸로)</li>
</ul>`,
  },
  {
    id: 'n4',
    title: '읽고 싶은 글 모음',
    folderId: 'personal',
    tagIds: ['reading'],
    snippet: '글쓰기 도구와 정보 정리에 관한 글들. 주말에 하나씩 읽기.',
    updatedLabel: '2일 전',
    source: `# 읽고 싶은 글 모음

주말에 하나씩 읽기.

- [좋은 노트는 다시 찾을 수 있는 노트다](https://example.com/notes)
- [마크다운 문법 가이드](https://example.com/markdown)
- [정보 정리의 기술](https://example.com/organize)
`,
    previewHtml: `<h1>읽고 싶은 글 모음</h1>
<p>주말에 하나씩 읽기.</p>
<ul>
<li><a href="https://example.com/notes">좋은 노트는 다시 찾을 수 있는 노트다</a></li>
<li><a href="https://example.com/markdown">마크다운 문법 가이드</a></li>
<li><a href="https://example.com/organize">정보 정리의 기술</a></li>
</ul>`,
  },
  {
    id: 'n5',
    title: '노트 앱 아이디어',
    folderId: 'work',
    tagIds: ['idea', 'dev'],
    snippet: '폴더와 태그를 함께 쓰되, 태그는 가로지르는 분류로만 쓰기.',
    updatedLabel: '3일 전',
    source: `# 노트 앱 아이디어

폴더와 태그를 함께 쓰되, 태그는 가로지르는 분류로만 쓰기.

## 떠오른 것들

- 최근 연 노트를 목록 위에 고정
- 빈 폴더에서 바로 새 노트 만들기
- 검색어를 본문에서 하이라이트

> 화면이 생각을 방해하지 않아야 한다.
`,
    previewHtml: `<h1>노트 앱 아이디어</h1>
<p>폴더와 태그를 함께 쓰되, 태그는 가로지르는 분류로만 쓰기.</p>
<h2>떠오른 것들</h2>
<ul>
<li>최근 연 노트를 목록 위에 고정</li>
<li>빈 폴더에서 바로 새 노트 만들기</li>
<li>검색어를 본문에서 하이라이트</li>
</ul>
<blockquote><p>화면이 생각을 방해하지 않아야 한다.</p></blockquote>`,
  },
  {
    id: 'n6',
    title: '디자인 리뷰 피드백',
    folderId: 'work',
    tagIds: ['meeting'],
    snippet: '카드 그림자는 빼고 배경색으로만 상태를 구분하자는 의견이 많았어요.',
    updatedLabel: '9월 21일',
    source: `# 디자인 리뷰 피드백

카드 그림자는 빼고 배경색으로만 상태를 구분하자는 의견이 많았어요.

- 파란색은 누를 수 있는 곳에만
- 타임스탬프는 회색, 본문은 진한 회색
- 삭제 확인 문구는 결과를 먼저 말하기
`,
    previewHtml: `<h1>디자인 리뷰 피드백</h1>
<p>카드 그림자는 빼고 배경색으로만 상태를 구분하자는 의견이 많았어요.</p>
<ul>
<li>파란색은 누를 수 있는 곳에만</li>
<li>타임스탬프는 회색, 본문은 진한 회색</li>
<li>삭제 확인 문구는 결과를 먼저 말하기</li>
</ul>`,
  },
  {
    id: 'n7',
    title: '여행 준비물',
    folderId: 'personal',
    tagIds: ['todo'],
    snippet: '여권, 충전기, 상비약. 출발 전날 한 번 더 확인하기.',
    updatedLabel: '9월 14일',
    source: `# 여행 준비물

출발 전날 한 번 더 확인하기.

1. 여권
2. 충전기와 어댑터
3. 상비약
`,
    previewHtml: `<h1>여행 준비물</h1>
<p>출발 전날 한 번 더 확인하기.</p>
<ol>
<li>여권</li>
<li>충전기와 어댑터</li>
<li>상비약</li>
</ol>`,
  },
]

export const tagById = new Map(tags.map((tag) => [tag.id, tag]))
export const folderById = new Map(folders.map((folder) => [folder.id, folder]))
