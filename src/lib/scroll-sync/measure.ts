// 스크롤 동기화에 쓰는 위치를 DOM에서 잰다. 읽기만 하고 화면에 보이는 것은 바꾸지 않는다 (add-scroll-sync design.md D3, D4)

import type { Anchor, LineTops } from './map'

// textarea의 줄바꿈을 결정하는 스타일. 상자 크기는 폭으로 따로 맞춘다
const COPIED_STYLES = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'fontStretch',
  'fontKerning',
  'fontFeatureSettings',
  'letterSpacing',
  'wordSpacing',
  'lineHeight',
  'textTransform',
  'textIndent',
  'tabSize',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
  'lineBreak',
  'hyphens',
  'direction',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const

// textarea와 같은 글꼴·패딩·폭으로 줄바꿈하는 숨은 상자. 동기화 하나가 하나를 만들어 다시 쓴다
export function createMirror(): HTMLDivElement {
  const mirror = document.createElement('div')
  mirror.setAttribute('aria-hidden', 'true')
  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    border: '0',
    height: 'auto',
    overflow: 'hidden',
  })
  document.body.append(mirror)
  return mirror
}

// 원문 각 줄의 위쪽 y. textarea의 내용 맨 위(패딩 포함)에서 잰다. 마지막 원소는 내용 끝이다
export function measureLineTops(textarea: HTMLTextAreaElement, mirror: HTMLDivElement): LineTops {
  const style = getComputedStyle(textarea)
  for (const name of COPIED_STYLES) mirror.style[name] = style[name]
  // clientWidth는 스크롤바와 테두리를 뺀 폭이라 textarea가 실제로 줄바꿈하는 폭과 같다
  mirror.style.width = `${textarea.clientWidth}px`

  const fragment = document.createDocumentFragment()
  for (const line of textarea.value.split('\n')) {
    const row = document.createElement('div')
    // 빈 줄도 한 줄 높이를 차지하게 한다
    row.textContent = line || '​'
    fragment.append(row)
  }
  mirror.replaceChildren(fragment)

  const rows = mirror.children as HTMLCollectionOf<HTMLElement>
  const tops: number[] = []
  for (const row of rows) tops.push(row.offsetTop)
  const last = rows[rows.length - 1]
  tops.push(last.offsetTop + last.offsetHeight)
  mirror.replaceChildren()
  return tops
}

// 미리보기 블록 앵커. 문서 순서이며 y는 미리보기 내용 맨 위에서 잰다
export function measureAnchors(preview: HTMLElement): Anchor[] {
  const base = preview.getBoundingClientRect().top + preview.clientTop - preview.scrollTop
  const anchors: Anchor[] = []
  for (const element of preview.querySelectorAll<HTMLElement>('[data-source-line]')) {
    const line = Number(element.dataset.sourceLine)
    if (Number.isFinite(line)) anchors.push({ line, top: element.getBoundingClientRect().top - base })
  }
  return anchors
}
