// 서식 도구 규칙. 원문과 선택 영역을 받아 새 원문과 새 선택 영역을 DOM 없이 계산한다 (add-markdown-formatting design.md D1)
// 원문에 반영하는 일은 apply-edit.ts가 맡는다. 두 모듈 사이의 계약은 Edit 하나다.

export type FormatVariant = 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'code'

export type FormatResult = { text: string; selStart: number; selEnd: number }

// [from, to)를 insert로 바꾸고 selStart~selEnd를 선택한다
export type Edit = { from: number; to: number; insert: string; selStart: number; selEnd: number }

export function format(variant: FormatVariant, text: string, selStart: number, selEnd: number): FormatResult {
  const sel = { start: Math.min(selStart, selEnd), end: Math.max(selStart, selEnd) }
  switch (variant) {
    case 'bold':
      return toggleInline(text, sel, '**')
    case 'italic':
      return toggleInline(text, sel, '*')
    case 'code':
      return spansLines(text, sel) ? toggleFence(text, sel) : toggleInlineCode(text, sel)
    case 'heading':
      return toggleHeading(text, sel)
    case 'list':
      return toggleList(text, sel)
    case 'link':
      return insertLink(text, sel)
  }
}

// 앞뒤 공통 부분을 잘라 실제로 바꿀 범위만 남긴다. 서로게이트 쌍 가운데를 자르지 않는다
export function toEdit(oldText: string, result: FormatResult): Edit {
  const next = result.text
  const max = Math.min(oldText.length, next.length)
  let prefix = 0
  while (prefix < max && oldText[prefix] === next[prefix]) prefix++
  if (prefix > 0 && isHighSurrogate(oldText.charCodeAt(prefix - 1))) prefix--
  let suffix = 0
  while (
    suffix < max - prefix &&
    oldText[oldText.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix++
  }
  if (suffix > 0 && isLowSurrogate(oldText.charCodeAt(oldText.length - suffix))) suffix--
  return {
    from: prefix,
    to: oldText.length - suffix,
    insert: next.slice(prefix, next.length - suffix),
    selStart: result.selStart,
    selEnd: result.selEnd,
  }
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff
}

// ---- 공통: 여러 곳을 한 번에 바꾸고 선택 영역을 따라 옮긴다 ----

type Sel = { start: number; end: number }
// at에서 del글자를 지우고 ins를 넣는다. 서로 겹치지 않아야 한다
type Op = { at: number; del: number; ins: string }

// 같은 자리에 글자를 넣을 때 선택 시작은 넣은 글자 뒤로, 선택 끝은 앞에 둔다. 그래야 감싼 기호가 선택에 들어가지 않는다
function applyOps(text: string, ops: Op[], sel: Sel): FormatResult {
  const sorted = ops.filter((op) => op.del > 0 || op.ins !== '').sort((a, b) => a.at - b.at)
  let out = ''
  let cursor = 0
  for (const op of sorted) {
    out += text.slice(cursor, op.at) + op.ins
    cursor = op.at + op.del
  }
  out += text.slice(cursor)
  const collapsed = sel.start === sel.end
  return {
    text: out,
    selStart: mapPosition(sel.start, sorted, true),
    selEnd: mapPosition(sel.end, sorted, collapsed),
  }
}

function mapPosition(pos: number, ops: Op[], after: boolean): number {
  let shift = 0
  for (const op of ops) {
    const opEnd = op.at + op.del
    if (opEnd < pos || (opEnd === pos && (op.del > 0 || after))) {
      shift += op.ins.length - op.del
    } else if (op.at < pos && pos < opEnd) {
      // 지워지는 범위 안에 있던 자리는 바뀐 글자 끝으로 옮긴다
      return op.at + op.ins.length + shift
    }
  }
  return pos + shift
}

// 선택 영역 앞뒤의 공백을 뺀 범위. 공백뿐이면 null
function trimmed(text: string, sel: Sel): Sel | null {
  let { start, end } = sel
  while (start < end && /\s/u.test(text[start])) start++
  while (end > start && /\s/u.test(text[end - 1])) end--
  return start === end ? null : { start, end }
}

// ---- 굵게, 기울임 ----

// 같은 기호 글자가 pos에서 dir 방향으로 몇 개 붙어 있는지
function runLength(text: string, pos: number, dir: 1 | -1, char: string): number {
  let count = 0
  let i = dir === 1 ? pos : pos - 1
  while (i >= 0 && i < text.length && text[i] === char) {
    count++
    i += dir
  }
  return count
}

// `*` 2·3개는 굵게, 1·3개는 기울임으로 감싸진 것이다 (스펙 "인라인 서식 감싸기와 풀기")
function isWrapRun(run: number, marker: string): boolean {
  return marker === '**' ? run === 2 || run === 3 : run === 1 || run === 3
}

// 감싼 기호를 지우는 두 Op. 양쪽 기호는 각각 범위 바로 바깥이나 바로 안쪽에 있으면 된다.
// 여러 줄을 감싼 직후의 선택은 첫 줄에서는 여는 기호 안쪽, 끝 줄에서는 닫는 기호 바깥에서 끝나기 때문이다
function unwrapOps(text: string, range: Sel, marker: string): Op[] | null {
  const char = marker[0]
  const k = marker.length
  let open: number | null = null
  let close: number | null = null
  if (isWrapRun(runLength(text, range.start, -1, char), marker)) open = range.start - k
  else if (isWrapRun(runLength(text, range.start, 1, char), marker)) open = range.start
  if (isWrapRun(runLength(text, range.end, 1, char), marker)) close = range.end
  else if (isWrapRun(runLength(text, range.end, -1, char), marker)) close = range.end - k
  if (open === null || close === null || close < open + k) return null
  // 기호 사이에 글자가 없으면(`****`를 통째로 고른 경우 등) 감싼 것으로 보지 않는다
  if (open >= range.start && close - (open + k) <= 0) return null
  return [
    { at: open, del: k, ins: '' },
    { at: close, del: k, ins: '' },
  ]
}

function toggleInline(text: string, sel: Sel, marker: string): FormatResult {
  const k = marker.length
  const range = trimmed(text, sel)
  if (!range) {
    // 선택이 없으면 빈 쌍을 넣거나, 커서가 빈 쌍 사이면 그 쌍을 지운다
    const at = sel.end
    const char = marker[0]
    const left = runLength(text, at, -1, char)
    const right = runLength(text, at, 1, char)
    if (left === right && isWrapRun(left, marker)) {
      return applyOps(text, [{ at: at - k, del: 2 * k, ins: '' }], { start: at, end: at })
    }
    return insertPair(text, at, marker, marker)
  }

  // 여러 줄이면 빈 줄이 아닌 줄마다 따로 감싼다. 모두 감싸져 있으면 모두 푼다
  const segments: Sel[] = []
  let lineStart = range.start
  for (const line of text.slice(range.start, range.end).split('\n')) {
    const segment = trimmed(text, { start: lineStart, end: lineStart + line.length })
    if (segment) segments.push(segment)
    lineStart += line.length + 1
  }
  const unwraps = segments.map((segment) => unwrapOps(text, segment, marker))
  if (unwraps.every((ops) => ops !== null)) return applyOps(text, unwraps.flat() as Op[], range)
  const ops: Op[] = []
  segments.forEach((segment, i) => {
    if (unwraps[i] === null) ops.push({ at: segment.start, del: 0, ins: marker }, { at: segment.end, del: 0, ins: marker })
  })
  return applyOps(text, ops, range)
}

// 커서 자리에 기호 한 쌍을 넣고 커서를 그 사이에 둔다
function insertPair(text: string, at: number, open: string, close: string): FormatResult {
  const cursor = at + open.length
  return { text: text.slice(0, at) + open + close + text.slice(at), selStart: cursor, selEnd: cursor }
}

// ---- 코드 ----

function toggleInlineCode(text: string, sel: Sel): FormatResult {
  const range = trimmed(text, sel)
  if (!range) {
    const at = sel.end
    if (text[at - 1] === '`' && text[at] === '`' && text[at - 2] !== '`' && text[at + 1] !== '`') {
      return applyOps(text, [{ at: at - 1, del: 2, ins: '' }], { start: at, end: at })
    }
    return insertPair(text, at, '`', '`')
  }
  const selected = text.slice(range.start, range.end)
  // 백틱이 든 글자는 두 개짜리 백틱과 안쪽 공백으로 감싼다 (CommonMark 인라인 코드 규칙)
  const pairs: [string, string][] = [['`` ', ' ``'], ['`', '`']]
  for (const [open, close] of pairs) {
    if (text.slice(range.start - open.length, range.start) === open && text.slice(range.end, range.end + close.length) === close) {
      if (open === '`' && (text[range.start - 2] === '`' || text[range.end + 1] === '`')) continue
      return applyOps(text, [{ at: range.start - open.length, del: open.length, ins: '' }, { at: range.end, del: close.length, ins: '' }], range)
    }
    if (selected.length > open.length + close.length && selected.startsWith(open) && selected.endsWith(close)) {
      if (open === '`' && (selected[1] === '`' || selected[selected.length - 2] === '`')) continue
      return applyOps(text, [{ at: range.start, del: open.length, ins: '' }, { at: range.end - close.length, del: close.length, ins: '' }], range)
    }
  }
  const [open, close] = selected.includes('`') ? pairs[0] : pairs[1]
  return applyOps(text, [{ at: range.start, del: 0, ins: open }, { at: range.end, del: 0, ins: close }], range)
}

// 선택 영역이 걸친 줄의 시작과 끝. 다음 줄 맨 앞에서 끝나는 선택은 그 줄을 넣지 않는다
function lineBounds(text: string, sel: Sel): { start: number; end: number } {
  const start = text.lastIndexOf('\n', sel.start - 1) + 1
  const last = sel.end > sel.start && text[sel.end - 1] === '\n' ? sel.end - 1 : sel.end
  const newline = text.indexOf('\n', last)
  return { start, end: newline === -1 ? text.length : newline }
}

function spansLines(text: string, sel: Sel): boolean {
  const bounds = lineBounds(text, sel)
  return text.slice(bounds.start, bounds.end).includes('\n')
}

function toggleFence(text: string, sel: Sel): FormatResult {
  const { start, end } = lineBounds(text, sel)
  if (start > 0 && end < text.length) {
    const prevStart = text.lastIndexOf('\n', start - 2) + 1
    const nextNewline = text.indexOf('\n', end + 1)
    const nextEnd = nextNewline === -1 ? text.length : nextNewline
    if (/^```[^`]*$/u.test(text.slice(prevStart, start - 1)) && /^```\s*$/u.test(text.slice(end + 1, nextEnd))) {
      return applyOps(text, [{ at: prevStart, del: start - prevStart, ins: '' }, { at: end, del: nextEnd - end, ins: '' }], sel)
    }
  }
  return applyOps(text, [{ at: start, del: 0, ins: '```\n' }, { at: end, del: 0, ins: '\n```' }], sel)
}

// ---- 제목, 목록 ----

// 걸친 줄 중 빈 줄이 아닌 줄의 시작 위치. 모두 빈 줄이면 모든 줄
function targetLines(text: string, sel: Sel): { start: number; line: string }[] {
  const bounds = lineBounds(text, sel)
  const lines: { start: number; line: string }[] = []
  let start = bounds.start
  for (const line of text.slice(bounds.start, bounds.end).split('\n')) {
    lines.push({ start, line })
    start += line.length + 1
  }
  const filled = lines.filter(({ line }) => line.trim() !== '')
  return filled.length > 0 ? filled : lines
}

const HEADING_PREFIX = /^#{1,6}(?:[ \t]+|$)/u

function toggleHeading(text: string, sel: Sel): FormatResult {
  const lines = targetLines(text, sel)
  if (lines.every(({ line }) => line.startsWith('## '))) {
    return applyOps(text, lines.map(({ start }) => ({ at: start, del: 3, ins: '' })), sel)
  }
  const ops = lines.map(({ start, line }) => {
    const prefix = HEADING_PREFIX.exec(line)?.[0] ?? ''
    return prefix === '## ' ? { at: start, del: 0, ins: '' } : { at: start, del: prefix.length, ins: '## ' }
  })
  return applyOps(text, ops, sel)
}

// 들여쓰기, 목록 기호, 체크박스(있으면)
const BULLET = /^([ \t]*)[-*+][ \t]+(?:\[[ xX]\][ \t]+)?/u
const ORDERED = /^([ \t]*)\d+[.)][ \t]+/u

function toggleList(text: string, sel: Sel): FormatResult {
  const lines = targetLines(text, sel)
  if (lines.every(({ line }) => BULLET.test(line))) {
    const ops = lines.map(({ start, line }) => {
      const [marker, indent] = BULLET.exec(line)!
      return { at: start + indent.length, del: marker.length - indent.length, ins: '' }
    })
    return applyOps(text, ops, sel)
  }
  const ops = lines.map(({ start, line }) => {
    if (BULLET.test(line)) return { at: start, del: 0, ins: '' }
    const ordered = ORDERED.exec(line)
    if (ordered) return { at: start + ordered[1].length, del: ordered[0].length - ordered[1].length, ins: '- ' }
    const indent = /^[ \t]*/u.exec(line)![0]
    return { at: start + indent.length, del: 0, ins: '- ' }
  })
  return applyOps(text, ops, sel)
}

// ---- 링크 ----

const URL_LIKE = /^https?:\/\/\S+$/u
const URL_PLACEHOLDER = 'url'

function insertLink(text: string, sel: Sel): FormatResult {
  const range = trimmed(text, sel)
  if (!range) {
    const at = sel.end
    return { text: text.slice(0, at) + `[](${URL_PLACEHOLDER})` + text.slice(at), selStart: at + 1, selEnd: at + 1 }
  }
  const selected = text.slice(range.start, range.end)
  const before = text.slice(0, range.start)
  const after = text.slice(range.end)
  // 주소를 골랐으면 그 주소로 링크를 만들고 링크 글자를 입력하게 한다
  if (URL_LIKE.test(selected)) {
    return { text: `${before}[](${selected})${after}`, selStart: range.start + 1, selEnd: range.start + 1 }
  }
  const urlStart = range.start + selected.length + 3
  return {
    text: `${before}[${selected}](${URL_PLACEHOLDER})${after}`,
    selStart: urlStart,
    selEnd: urlStart + URL_PLACEHOLDER.length,
  }
}
