// 내용 검색 규칙. 일치 판정, 하이라이트 구간, 발췌를 DOM 없이 계산한다 (add-note-search design.md D2–D4)

export type Segment = { text: string; mark: boolean }
type Range = [start: number, end: number]

// 비교용 정규화. 태그 비교(tagKey)와 같은 소문자 규칙에 NFC를 더한다
export function fold(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('ko')
}

// 공백으로 나눈 단어. 빈 단어는 버리고 같은 단어는 하나로 합친다. 빈 배열이면 검색하지 않는 것이다
export function searchTerms(query: string): string[] {
  return [...new Set(fold(query).split(/\s+/u).filter(Boolean))]
}

// folded는 fold()를 거친 검색 대상 텍스트다. 단어에 공백이 없어서 줄 경계를 넘어 일치하지 않는다
export function matches(folded: string, terms: string[]): boolean {
  return terms.every((term) => folded.includes(term))
}

// fold 결과의 각 글자가 원래(NFC) 문자열의 어느 글자에서 왔는지. 소문자화로 길이가 바뀌는 글자(예: İ)가 있을 때만 만든다
function foldWithMap(text: string): { folded: string; starts: number[] | null; ends: number[] | null } {
  const whole = text.toLocaleLowerCase('ko')
  // 길이가 같으면 글자마다 제자리라 대응표가 필요 없다. 문맥에 따라 바뀌는 그리스어 끝 시그마도 길이는 같다
  if (whole.length === text.length) return { folded: whole, starts: null, ends: null }
  let folded = ''
  const starts: number[] = []
  const ends: number[] = []
  for (let i = 0; i < text.length; ) {
    const char = String.fromCodePoint(text.codePointAt(i)!)
    const lower = char.toLocaleLowerCase('ko')
    for (let k = 0; k < lower.length; k++) {
      starts.push(i)
      ends.push(i + char.length)
    }
    folded += lower
    i += char.length
  }
  return { folded, starts, ends }
}

// text(NFC)에서 단어가 일치한 구간. 겹치거나 맞닿은 구간은 합친다
function highlightRanges(text: string, terms: string[]): Range[] {
  const { folded, starts, ends } = foldWithMap(text)
  const ranges: Range[] = []
  for (const term of terms) {
    for (let at = folded.indexOf(term); at !== -1; at = folded.indexOf(term, at + 1)) {
      const end = at + term.length
      ranges.push(starts && ends ? [starts[at], ends[end - 1]] : [at, end])
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: Range[] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return merged
}

function toSegments(text: string, ranges: Range[]): Segment[] {
  const segments: Segment[] = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at) segments.push({ text: text.slice(at, start), mark: false })
    segments.push({ text: text.slice(start, end), mark: true })
    at = end
  }
  if (at < text.length) segments.push({ text: text.slice(at), mark: false })
  return segments
}

// 화면에 그릴 조각. 글자는 NFC로 바꿔 돌려준다(보기에는 원문과 같다)
export function highlight(text: string, terms: string[]): Segment[] {
  const nfc = text.normalize('NFC')
  return toSegments(nfc, highlightRanges(nfc, terms))
}

const EXCERPT_LEAD = 24

// 본문에서 어떤 단어든 처음 나오는 줄의 발췌. 첫 일치 앞이 24자를 넘으면 앞을 잘라 …로 시작한다.
// 뒤는 자르지 않고 카드의 두 줄 제한에 맡긴다. 일치하는 줄이 없으면 null
export function excerpt(body: string[], terms: string[]): Segment[] | null {
  for (const line of body) {
    const nfc = line.normalize('NFC')
    const ranges = highlightRanges(nfc, terms)
    if (ranges.length === 0) continue

    const first = ranges[0][0]
    if (first <= EXCERPT_LEAD) return toSegments(nfc, ranges)

    // 앞 24자 안에서 일치와 가장 먼 공백 뒤에서 자른다. 공백이 없으면 24자 자리에서 자르되 서로게이트 쌍은 가르지 않는다
    let cut = first - EXCERPT_LEAD
    const space = nfc.slice(cut, first).search(/\s/u)
    if (space !== -1) cut += space + 1
    else if (/[\uDC00-\uDFFF]/.test(nfc[cut])) cut++
    const shifted = ranges.map(([start, end]): Range => [start - cut + 1, end - cut + 1])
    return toSegments(`…${nfc.slice(cut)}`, shifted)
  }
  return null
}
