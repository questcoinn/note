// 마크다운 원문 → 미리보기 HTML, 제목, 미리보기 문장. 파싱은 노트당 한 번만 하고 세 값이 토큰을 공유한다.

import DOMPurify from 'dompurify'
import MarkdownIt, { type StateCore, type Token } from 'markdown-it'

// html: false — 원문에 쓴 HTML 태그는 글자 그대로 보인다
const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false })
const { escapeHtml } = md.utils

// 이미지는 주소로 요청을 보내지 않고 대체 텍스트로만 보여준다
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const alt = self.renderInlineAsText(tokens[idx].children ?? [], options, env).trim()
  return `<span class="image-alt">${alt ? `이미지: ${escapeHtml(alt)}` : '이미지'}</span>`
}

// 넓은 표는 표 영역 안에서만 가로 스크롤한다. table에 display:block을 쓰면 Safari가 표 의미를 잃어 감싼다
md.renderer.rules.table_open = (tokens, idx, options, _env, self) =>
  `<div class="table-scroll">${self.renderToken(tokens, idx, options)}`
md.renderer.rules.table_close = (tokens, idx, options, _env, self) => `${self.renderToken(tokens, idx, options)}</div>\n`

// GFM 체크박스 목록 (보기 전용). `- [ ] 할 일`의 접두사를 지우고 disabled 체크박스를 앞에 넣는다
const TASK_PREFIX = /^\[([ xX])\] /

function taskList(state: StateCore) {
  const { tokens } = state
  for (let i = 2; i < tokens.length; i++) {
    const inline = tokens[i]
    if (inline.type !== 'inline' || tokens[i - 1].type !== 'paragraph_open' || tokens[i - 2].type !== 'list_item_open') {
      continue
    }
    const first = inline.children?.[0]
    const match = first?.type === 'text' ? TASK_PREFIX.exec(first.content) : null
    if (!first || !match) continue

    first.content = first.content.slice(match[0].length)
    inline.content = inline.content.slice(match[0].length)
    const label = inlineLines(inline).join(' ')
    const checkbox = new state.Token('html_inline', '', 0)
    // html: false는 파싱 단계에만 적용되므로 규칙이 만든 html_inline은 그대로 출력된다. 라벨은 반드시 이스케이프
    checkbox.content = `<input type="checkbox" disabled${match[1] === ' ' ? '' : ' checked'} aria-label="${escapeHtml(label)}"> `
    inline.children!.unshift(checkbox)
    tokens[i - 2].attrJoin('class', 'task')
  }
}

md.core.ruler.after('inline', 'task-list', taskList)

// 링크는 새 탭에서 열고 새 탭이 앱 창에 접근하지 못하게 한다.
// DOMPurify는 기본 설정에서 target을 지우므로 정화가 끝난 뒤 붙인다.
// 전역 훅이다: 다른 정화 용도가 생기면 DOMPurify(window)로 별도 인스턴스를 만들 것
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function parse(source: string): Token[] {
  return md.parse(source, {})
}

export function renderHtml(tokens: Token[]): string {
  const html = md.renderer.render(tokens, md.options, {})
  // img 금지는 이미지 렌더러가 바뀌어도 외부 요청이 생기지 않게 하는 이중 방어
  return DOMPurify.sanitize(html, { FORBID_TAGS: ['img', 'style', 'form'], FORBID_ATTR: ['style'] })
}

// 제목·미리보기 문장 파생 (design.md D7)

// cell은 표 셀이다. 검색에만 쓰고 제목·미리보기 문장 규칙에는 넣지 않는다 (add-note-search design.md D1)
type Block = { kind: 'heading' | 'text' | 'code' | 'cell'; tag: string; lines: string[] }

// inline 토큰을 서식 기호 없는 줄 배열로 만든다. 줄바꿈에서 끊고 빈 줄은 버린다
function inlineLines(inline: Token): string[] {
  const lines: string[] = []
  let current = ''
  for (const child of inline.children ?? []) {
    if (child.type === 'softbreak' || child.type === 'hardbreak') {
      lines.push(current)
      current = ''
    } else if (child.type === 'text' || child.type === 'text_special' || child.type === 'code_inline') {
      current += child.content
    } else if (child.type === 'image') {
      current += inlineLines(child).join(' ')
    }
  }
  lines.push(current)
  return lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

function collectBlocks(tokens: Token[]): Block[] {
  const blocks: Block[] = []
  tokens.forEach((token, i) => {
    if (token.type === 'heading_open' || token.type === 'paragraph_open') {
      const lines = inlineLines(tokens[i + 1])
      if (lines.length > 0) {
        blocks.push({ kind: token.type === 'heading_open' ? 'heading' : 'text', tag: token.tag, lines })
      }
    } else if (token.type === 'fence' || token.type === 'code_block') {
      const lines = token.content.split('\n').map((line) => line.trim()).filter(Boolean)
      if (lines.length > 0) blocks.push({ kind: 'code', tag: token.tag, lines })
    } else if (token.type === 'th_open' || token.type === 'td_open') {
      const lines = inlineLines(tokens[i + 1])
      if (lines.length > 0) blocks.push({ kind: 'cell', tag: token.tag, lines })
    }
  })
  return blocks
}

// 제목으로 쓴 위치. line이 null이면 블록 전체(1단계 제목)를 제목으로 썼다는 뜻
type TitleSource = { block: Block; line: number | null } | null

function findTitle(blocks: Block[]): TitleSource {
  const h1 = blocks.find((block) => block.kind === 'heading' && block.tag === 'h1')
  if (h1) return { block: h1, line: null }
  const first = blocks.find((block) => block.kind !== 'cell')
  return first ? { block: first, line: 0 } : null
}

function titleText(source: TitleSource): string | null {
  if (!source) return null
  return source.line === null ? source.block.lines.join(' ') : source.block.lines[source.line]
}

export type Derived = { title: string; snippet: string }

export function extractTitleAndSnippet(tokens: Token[]): Derived {
  const blocks = collectBlocks(tokens)
  const source = findTitle(blocks)
  const title = titleText(source) ?? '제목 없음'

  let snippet = ''
  for (const block of blocks) {
    if (block.kind !== 'text') continue
    const lines = block === source?.block ? block.lines.filter((_, i) => i !== source.line) : block.lines
    if (lines.length > 0) {
      snippet = lines.join(' ')
      break
    }
  }
  return { title, snippet }
}

// 검색 대상 텍스트. 미리보기에 보이는 글자에서 제목과 나머지 줄을 나눈다.
// 대체 제목("제목 없음")은 내용이 아니라서 title이 ''다 (add-note-search design.md D1)
export type SearchText = { title: string; body: string[] }

export function extractSearchText(tokens: Token[]): SearchText {
  const blocks = collectBlocks(tokens)
  const source = findTitle(blocks)
  const body: string[] = []
  for (const block of blocks) {
    if (block !== source?.block) body.push(...block.lines)
    else if (source.line !== null) body.push(...block.lines.filter((_, i) => i !== source.line))
  }
  return { title: titleText(source) ?? '', body }
}
