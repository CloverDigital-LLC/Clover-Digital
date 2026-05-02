/**
 * Top-of-page momentum strip — the dopamine surface.
 *
 * Mason: "I do need something at the top that gives me dopamine."
 * Trimmed to the two signals that compress the cleanest:
 *   - 🔥 day-shipping streak (gamification anchor)
 *   - 7-day shipped count (week roll-up)
 *
 * "Just landed" + "Latest commit" used to live here too — Mason pulled
 * them to keep the bar tight. The data still surfaces in BriefingCard
 * (recently shipped) and BrandCard via /projects/clover-digital.
 *
 * Calm clover/ochre tones — TodayStripe handles "what's on fire,"
 * this handles "what's on rails."
 */
import { useBriefing } from '../hooks/useBriefing'
import { useShipStreak } from '../hooks/useMoney'

export function WinsStripe() {
  const { rollup } = useBriefing()
  const { data: streak } = useShipStreak()

  const shippedCount = rollup.shipped_this_week
  const streakDays = streak?.current_streak_days ?? 0

  // Don't render anything if both signals are 0. Returning a Fragment lets
  // the parent dashboard flow these pills inline with TodayStripe's pills
  // so momentum + attention live in a single wrapping row.
  if (shippedCount === 0 && streakDays === 0) return null

  return (
    <>
      {/* Streak — gamification anchor */}
      {streakDays > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-ochre-100 ring-1 ring-ochre-300/60"
          title={
            streak?.longest_streak_days
              ? `Longest streak in last 60d: ${streak.longest_streak_days} days`
              : ''
          }
        >
          <span className="text-[14px] leading-none">🔥</span>
          <span className="font-display text-[18px] tabular-nums text-ochre-500 leading-none">
            {streakDays}
          </span>
          <span className="text-[12px] text-ochre-500 leading-none">
            day{streakDays === 1 ? '' : 's'} shipping
          </span>
        </div>
      )}

      {/* Shipped count — the week roll-up */}
      {shippedCount > 0 && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-clover-50 dark:bg-night-700 ring-1 ring-clover-200">
          <span className="font-display text-[18px] tabular-nums text-clover-700 leading-none">
            {shippedCount}
          </span>
          <span className="text-[12px] text-clover-800 dark:text-clover-200 leading-none">
            shipped this week
          </span>
        </div>
      )}
    </>
  )
}
