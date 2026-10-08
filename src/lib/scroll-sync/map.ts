// 원문 y ↔ 원문 줄(논리 위치) ↔ 미리보기 y 대응. DOM을 모르는 순수 함수다 (add-scroll-sync design.md D1, D4)
// y는 모두 각 스크롤 영역의 내용 맨 위에서 잰 값이고, 영역의 위치는 scrollTop(보이는 위쪽 끝)으로 본다.

// lineTops[i]는 원문 i번째 줄(0부터)의 위쪽 y다. 마지막 원소는 내용 끝 y라서 길이가 줄 수 + 1이다
export type LineTops = readonly number[]

// 미리보기에서 원문 line번째 줄로 시작하는 블록이 그려진 위쪽 y
export type Anchor = { line: number; top: number }

export type Knot = { src: number; pv: number }

// y가 있는 원문 줄. 소수 부분은 그 줄 높이 안에서의 비율이다
export function lineAt(lineTops: LineTops, y: number): number {
  const last = lineTops.length - 1
  if (last < 1 || y <= lineTops[0]) return 0
  if (y >= lineTops[last]) return last
  // lineTops[low] <= y < lineTops[high]인 가장 좁은 구간을 찾는다
  let low = 0
  let high = last
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (lineTops[mid] <= y) low = mid
    else high = mid
  }
  const height = lineTops[high] - lineTops[low]
  return low + (height > 0 ? (y - lineTops[low]) / height : 0)
}

export function yOfLine(lineTops: LineTops, line: number): number {
  const last = lineTops.length - 1
  if (last < 1 || line <= 0) return lineTops[0] ?? 0
  if (line >= last) return lineTops[last]
  const index = Math.floor(line)
  return lineTops[index] + (line - index) * (lineTops[index + 1] - lineTops[index])
}

// 매듭은 (0, 0), 앵커들, (srcMax, pvMax) 순이고 양쪽 값이 모두 증가한다.
// 같은 줄 앵커는 앞의 것(바깥 요소)만 남고, 순서가 뒤집히거나 끝에 닿는 앵커는 버린다.
// 마지막 매듭이 양쪽 끝이라서 한쪽이 끝에 닿으면 다른 쪽도 끝에 닿는다
export function buildKnots(anchors: readonly Anchor[], lineTops: LineTops, srcMax: number, pvMax: number): Knot[] {
  const knots: Knot[] = [{ src: 0, pv: 0 }]
  for (const anchor of anchors) {
    const previous = knots[knots.length - 1]
    const src = yOfLine(lineTops, anchor.line)
    if (src <= previous.src || anchor.top <= previous.pv || src >= srcMax || anchor.top >= pvMax) continue
    knots.push({ src, pv: anchor.top })
  }
  knots.push({ src: Math.max(srcMax, 0), pv: Math.max(pvMax, 0) })
  return knots
}

// 원문 줄 ↔ 미리보기 y 매듭. src 자리에 y 대신 줄 번호가 든다. 원문을 잴 수 없을 때(좁은 화면에서 숨은 원문)도
// 미리보기 위치를 논리 위치로 바꿀 수 있게, 미리보기 쪽 논리 위치 변환은 늘 이 매듭을 쓴다
export function buildLineKnots(anchors: readonly Anchor[], lineCount: number, pvMax: number): Knot[] {
  const knots: Knot[] = [{ src: 0, pv: 0 }]
  for (const anchor of anchors) {
    const previous = knots[knots.length - 1]
    if (anchor.line <= previous.src || anchor.top <= previous.pv || anchor.line >= lineCount || anchor.top >= pvMax) {
      continue
    }
    knots.push({ src: anchor.line, pv: anchor.top })
  }
  knots.push({ src: lineCount, pv: Math.max(pvMax, 0) })
  return knots
}

function interpolate(knots: readonly Knot[], from: keyof Knot, to: keyof Knot, x: number): number {
  const first = knots[0]
  const last = knots[knots.length - 1]
  if (x <= first[from]) return first[to]
  if (x >= last[from]) return last[to]
  let i = 0
  while (knots[i + 1][from] <= x) i++
  const a = knots[i]
  const b = knots[i + 1]
  return a[to] + ((x - a[from]) / (b[from] - a[from])) * (b[to] - a[to])
}

export function srcToPv(knots: readonly Knot[], y: number): number {
  return interpolate(knots, 'src', 'pv', y)
}

export function pvToSrc(knots: readonly Knot[], y: number): number {
  return interpolate(knots, 'pv', 'src', y)
}
