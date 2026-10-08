// 원문 textarea와 미리보기 영역의 스크롤 동기화 (add-scroll-sync design.md D5~D8)
//
// - 넓은 화면(두 영역이 모두 보임): 기준 쪽(owner)의 scrollTop을 y 매듭으로 바꿔 상대 쪽에 즉시 넣는다
// - 좁은 화면(한 영역만 보임): 보이는 쪽에서 논리 위치(원문 줄)만 갱신하고, 탭 전환으로 새로 보이는 쪽을 그 위치로 옮긴다
// 화면 폭 분기를 따로 두지 않고 영역이 그려져 있는지만 본다. CSS가 숨긴 쪽은 자연히 건너뛴다.

import {
  buildKnots,
  buildLineKnots,
  lineAt,
  pvToSrc,
  srcToPv,
  yOfLine,
  type Anchor,
  type Knot,
  type LineTops,
} from './map'
import { createMirror, measureAnchors, measureLineTops } from './measure'

type Side = 'source' | 'preview'

// 논리 위치. line은 원문 줄 번호(소수), atEnd는 맨 아래에 닿아 있었다는 뜻이다 (design.md D1)
type SourcePos = { line: number; atEnd: boolean }

// 이 입력이 일어난 영역이 기준이 된다. 스크롤바를 끄는 것도 그 요소의 pointerdown이다 (design.md D5)
const OWNER_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'focusin'] as const

// 입력이 멈췄다고 보는 시간
const SETTLE_DELAY = 150

const other = (side: Side): Side => (side === 'source' ? 'preview' : 'source')
const isRendered = (element: HTMLElement) => element.getClientRects().length > 0
const scrollMax = (element: HTMLElement) => Math.max(element.scrollHeight - element.clientHeight, 0)

export class ScrollSync {
  readonly #elements: Record<Side, HTMLElement>
  readonly #textarea: HTMLTextAreaElement
  readonly #mirror = createMirror()
  readonly #observer: ResizeObserver
  readonly #controller = new AbortController()

  #owner: Side = 'source'
  #pos: SourcePos = { line: 0, atEnd: false }
  // 프로그램으로 넣은 scrollTop. 그 값의 scroll 이벤트는 사용자 스크롤이 아니다
  #expected: Record<Side, number | null> = { source: null, preview: null }
  // 미리보기에서 포인터로 글자를 선택하는 중 (design.md D7)
  #selecting = false
  // 미리보기를 다시 그린 뒤 다시 맞추기 전까지. 이 사이 상대 쪽 스크롤은 브라우저의 스크롤 앵커링이나
  // 높이 변화 때문이라 사용자 스크롤이 아니다
  #rerendered = false
  #frame = 0
  #settleTimer = 0

  // 측정값. 내용이나 크기가 바뀌면 지우고 필요할 때 다시 잰다 (design.md D3, D4)
  #lineTops: LineTops | null = null
  #anchors: Anchor[] | null = null
  #knots: Knot[] | null = null
  // 측정할 때 두 영역의 크기. 폭이 바뀐 직후 ResizeObserver보다 스크롤 이벤트가 먼저 올 수 있어
  // (Chrome은 textarea 폭이 바뀌면 보던 줄을 지키려고 직접 스크롤한다) 쓸 때마다 크기를 견줘 본다
  #measuredLayout = ''

  constructor(source: HTMLTextAreaElement, preview: HTMLElement) {
    this.#textarea = source
    this.#elements = { source, preview }
    const { signal } = this.#controller

    for (const side of ['source', 'preview'] as const) {
      const element = this.#elements[side]
      for (const type of OWNER_EVENTS) {
        element.addEventListener(type, () => this.#takeOwnership(side), { passive: true, signal })
      }
      element.addEventListener('scroll', () => this.#onscroll(side), { passive: true, signal })
    }

    preview.addEventListener(
      'pointerdown',
      (event) => {
        // 스크롤바 위가 아니라 내용 위에서 누른 경우만 글자 선택으로 본다
        const x = event.clientX - preview.getBoundingClientRect().left - preview.clientLeft
        if (event.button === 0 && x < preview.clientWidth) this.#selecting = true
      },
      { passive: true, signal },
    )
    const stopSelecting = () => (this.#selecting = false)
    window.addEventListener('pointerup', stopSelecting, { passive: true, signal })
    window.addEventListener('pointercancel', stopSelecting, { passive: true, signal })

    // 창 폭, 사이드바, 탭 전환(display: none ↔ 보임), 스크롤바 생김이 모두 여기로 온다 (design.md D6)
    this.#observer = new ResizeObserver(() => this.#onresize())
    this.#observer.observe(source)
    this.#observer.observe(preview)
  }

  destroy() {
    this.#controller.abort()
    this.#observer.disconnect()
    cancelAnimationFrame(this.#frame)
    clearTimeout(this.#settleTimer)
    this.#mirror.remove()
  }

  // 다른 노트를 열었다. 두 영역 모두 맨 위에서 시작한다
  reset() {
    this.#invalidate()
    this.#owner = 'source'
    this.#pos = { line: 0, atEnd: false }
    this.#setScroll('source', 0)
    this.#setScroll('preview', 0)
  }

  // 원문이 바뀌어 미리보기가 다시 그려졌다. 기준 쪽 scrollTop은 그대로 두고 상대 쪽만 다시 맞춘다.
  // 기준 쪽 위에서 줄이 늘거나 줄면 줄 번호가 밀리므로 저장된 논리 위치가 아니라 px를 기준으로 삼는다.
  // 긴 노트는 측정이 키 입력마다 렌더만큼 들어서 입력이 멈춘 뒤 한 번만 맞춘다. 그동안 미리보기는
  // overflow-anchor: none으로 제자리에 있고, 대부분의 입력은 맨 위보다 아래쪽이라 어긋나지 않는다
  contentChanged() {
    this.#invalidate()
    this.#rerendered = true
    clearTimeout(this.#settleTimer)
    this.#settleTimer = window.setTimeout(() => this.#schedule(), SETTLE_DELAY)
  }

  // 탭을 바꾸기 직전에 부른다. 바뀐 뒤에는 지금 보이는 쪽이 이미 숨겨져 있다
  capture() {
    const visible = this.#visibleSide()
    if (visible) this.#pos = this.#posFrom(visible)
  }

  #takeOwnership(side: Side) {
    this.#owner = side
    this.#expected[side] = null
  }

  #onscroll(side: Side) {
    const expected = this.#expected[side]
    this.#expected[side] = null
    if (expected !== null && Math.abs(this.#elements[side].scrollTop - expected) <= 1) return
    if (this.#rerendered && side !== this.#owner) return
    // 기준이 아닌 쪽의 예상 밖 스크롤(찾기, 캐럿을 보이게 하는 브라우저 스크롤 등)은 그 쪽을 기준으로 바꾼다
    this.#owner = side
    if (side === 'preview' && this.#selecting) return
    this.#schedule()
  }

  #onresize() {
    this.#invalidate()
    if (!isRendered(this.#elements[this.#owner])) {
      const visible = this.#visibleSide()
      if (!visible) return
      this.#owner = visible
    }
    // 줄바꿈이 바뀌면 같은 px가 다른 내용을 가리키므로 논리 위치로 기준 쪽을 되돌린다
    this.#setScroll(this.#owner, this.#yFromPos(this.#owner, this.#pos))
    this.#sync()
  }

  #schedule() {
    if (this.#frame) return
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0
      this.#sync()
      this.#rerendered = false
    })
  }

  // 기준 쪽 → 논리 위치, 그리고 상대 쪽이 보이면 상대 쪽 scrollTop
  #sync() {
    const from = this.#owner
    const to = other(from)
    if (!isRendered(this.#elements[from])) return
    this.#pos = this.#posFrom(from)
    if (!isRendered(this.#elements[to])) return

    const y = this.#elements[from].scrollTop
    const knots = this.#yKnots()
    this.#setScroll(to, from === 'source' ? srcToPv(knots, y) : pvToSrc(knots, y))
  }

  #visibleSide(): Side | null {
    if (isRendered(this.#elements[this.#owner])) return this.#owner
    const side = other(this.#owner)
    return isRendered(this.#elements[side]) ? side : null
  }

  #setScroll(side: Side, y: number) {
    const element = this.#elements[side]
    const target = Math.min(Math.max(y, 0), scrollMax(element))
    if (Math.abs(element.scrollTop - target) < 0.5) return
    element.scrollTop = target
    // 브라우저가 반올림한 실제 값을 기억한다
    this.#expected[side] = element.scrollTop
  }

  #posFrom(side: Side): SourcePos {
    const element = this.#elements[side]
    const y = element.scrollTop
    const max = scrollMax(element)
    const atEnd = max > 0 && y >= max - 1
    if (side === 'source') return { line: lineAt(this.#measureLineTops(), y), atEnd }
    return { line: pvToSrc(this.#lineKnots(), y), atEnd }
  }

  #yFromPos(side: Side, pos: SourcePos): number {
    const element = this.#elements[side]
    if (pos.atEnd) return scrollMax(element)
    if (side === 'source') return yOfLine(this.#measureLineTops(), pos.line)
    return srcToPv(this.#lineKnots(), pos.line)
  }

  #invalidate() {
    this.#lineTops = null
    this.#anchors = null
    this.#knots = null
    this.#measuredLayout = ''
  }

  #checkLayout() {
    const { source, preview } = this.#elements
    const layout = `${source.clientWidth}x${source.clientHeight} ${preview.clientWidth}x${preview.clientHeight}`
    if (layout === this.#measuredLayout) return
    this.#invalidate()
    this.#measuredLayout = layout
  }

  #measureLineTops(): LineTops {
    this.#checkLayout()
    return (this.#lineTops ??= measureLineTops(this.#textarea, this.#mirror))
  }

  #measureAnchors(): Anchor[] {
    this.#checkLayout()
    return (this.#anchors ??= measureAnchors(this.#elements.preview))
  }

  // 원문 y ↔ 미리보기 y. 두 영역이 모두 보일 때만 쓴다
  #yKnots(): Knot[] {
    this.#checkLayout()
    return (this.#knots ??= buildKnots(
      this.#measureAnchors(),
      this.#measureLineTops(),
      scrollMax(this.#elements.source),
      scrollMax(this.#elements.preview),
    ))
  }

  // 원문 줄 ↔ 미리보기 y. 원문이 숨어 있어도 쓸 수 있다
  #lineKnots(): Knot[] {
    let lineCount = 1
    for (const char of this.#textarea.value) if (char === '\n') lineCount++
    return buildLineKnots(this.#measureAnchors(), lineCount, scrollMax(this.#elements.preview))
  }
}
