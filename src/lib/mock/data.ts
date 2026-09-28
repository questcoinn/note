// 정적 목업 데이터. 노트 내용은 원문(source)만 적고 제목·미리보기 문장·미리보기 HTML은 원문에서 파생한다.
// count, updatedLabel은 아직 파생하지 않고 직접 적는다.

export type Folder = { id: string; name: string; count: number }
export type Tag = { id: string; name: string; count: number }
export type NoteSeed = {
  id: string
  folderId: string
  tagIds: string[]
  updatedLabel: string
  source: string
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

export const noteSeeds: NoteSeed[] = [
  {
    id: 'n1',
    folderId: 'work',
    tagIds: ['meeting', 'todo'],
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
  },
  {
    id: 'n2',
    folderId: 'work',
    tagIds: ['dev'],
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
  },
  {
    id: 'n3',
    folderId: 'personal',
    tagIds: ['todo'],
    updatedLabel: '어제',
    source: `# 주말 장보기

- 우유
- 달걀 한 판
- 사과
- 커피 원두 (지난번과 같은 걸로)
`,
  },
  {
    id: 'n4',
    folderId: 'personal',
    tagIds: ['reading'],
    updatedLabel: '2일 전',
    source: `# 읽고 싶은 글 모음

주말에 하나씩 읽기.

- [좋은 노트는 다시 찾을 수 있는 노트다](https://example.com/notes)
- [마크다운 문법 가이드](https://example.com/markdown)
- [정보 정리의 기술](https://example.com/organize)
`,
  },
  {
    id: 'n5',
    folderId: 'work',
    tagIds: ['idea', 'dev'],
    updatedLabel: '3일 전',
    source: `# 노트 앱 아이디어

폴더와 태그를 함께 쓰되, 태그는 가로지르는 분류로만 쓰기.

## 떠오른 것들

- 최근 연 노트를 목록 위에 고정
- 빈 폴더에서 바로 새 노트 만들기
- 검색어를 본문에서 하이라이트

> 화면이 생각을 방해하지 않아야 한다.
`,
  },
  {
    id: 'n6',
    folderId: 'work',
    tagIds: ['meeting'],
    updatedLabel: '9월 21일',
    source: `# 디자인 리뷰 피드백

카드 그림자는 빼고 배경색으로만 상태를 구분하자는 의견이 많았어요.

- 파란색은 누를 수 있는 곳에만
- 타임스탬프는 회색, 본문은 진한 회색
- 삭제 확인 문구는 결과를 먼저 말하기
`,
  },
  {
    id: 'n7',
    folderId: 'personal',
    tagIds: ['todo'],
    updatedLabel: '9월 14일',
    source: `# 여행 준비물

출발 전날 한 번 더 확인하기.

1. 여권
2. 충전기와 어댑터
3. 상비약
`,
  },
]

export const tagById = new Map(tags.map((tag) => [tag.id, tag]))
export const folderById = new Map(folders.map((folder) => [folder.id, folder]))
