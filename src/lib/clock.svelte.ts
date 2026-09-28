// 상대 시각 문구가 쓰는 공용 현재 시각. 카드마다 타이머를 두지 않고 1분마다 한 번만 갱신한다.

export const clock = $state({ now: Date.now() })

setInterval(() => {
  clock.now = Date.now()
}, 60_000)

const MINUTE = 60_000
const HOUR = 60 * MINUTE

// 달력 기준 날짜 차이 (로컬 시간대). 시각이 아니라 날짜만 비교한다
function calendarDaysBetween(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((toDay - fromDay) / (24 * HOUR))
}

// 규칙: openspec note-ui-skeleton "수정 시각 문구"
export function formatUpdatedLabel(updatedAt: string, now: number): string {
  const updated = new Date(updatedAt)
  const elapsed = now - updated.getTime()
  // 편집 직후에는 clock.now가 아직 갱신 전이라 수정 시각이 더 늦을 수 있다
  if (elapsed < MINUTE) return '방금 전'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`

  const today = new Date(now)
  const days = calendarDaysBetween(updated, today)
  if (days === 0) return `${Math.floor(elapsed / HOUR)}시간 전`
  if (days === 1) return '어제'
  if (days <= 6) return `${days}일 전`

  const monthDay = `${updated.getMonth() + 1}월 ${updated.getDate()}일`
  return updated.getFullYear() === today.getFullYear() ? monthDay : `${updated.getFullYear()}년 ${monthDay}`
}
