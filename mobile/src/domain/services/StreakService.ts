// Business logic for Streak operations
import type { Addiction } from '../models/Addiction';
import type { Streak } from '../models/Streak';

/**
 * Number of milliseconds in a full 24-hour day.
 * Using a constant avoids magic numbers and keeps intent clear.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Safely calculates the number of full elapsed days between two instants in time.
 *
 * - Uses underlying UTC timestamps (milliseconds since Unix epoch).
 * - Counts full 24-hour periods, not calendar days.
 * - If `end` is before or equal to `start`, returns 0.
 *
 * This helper is intentionally kept free of any domain-specific meaning,
 * so it can be reused in other date-based calculations.
 */
function getFullDaysBetween(start: Date, end: Date): number {
  const startTime: number = start.getTime();
  const endTime: number = end.getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    throw new Error('getFullDaysBetween: Invalid Date provided.');
  }

  if (endTime <= startTime) {
    return 0;
  }

  const diffMs: number = endTime - startTime;

  // Use Math.floor on a positive number of milliseconds.
  // This gives the count of fully completed 24-hour periods.
  const fullDays: number = Math.floor(diffMs / MS_PER_DAY);

  if (fullDays < 0) {
    // This should never happen given the checks above,
    // but we guard to keep the function safe and predictable.
    return 0;
  }

  return fullDays;
}

/**
 * Input shape for streak calculation based on domain timestamps.
 *
 * - `createdAt`: when tracking started.
 * - `lastResetAt`: most recent reset, if any. When undefined,
 *   the streak is measured from `createdAt`.
 * - `now`: reference time at which the streak is evaluated.
 */
export interface StreakCalculationInput {
  createdAt: Date;
  lastResetAt?: Date;
  now: Date;
}

export class StreakService {
  /**
   * Pure function for calculating the current streak length in full days.
   *
   * Domain rules:
   * - Streak starts at `createdAt` if there is no valid `lastResetAt`.
   * - If there is a `lastResetAt` after `createdAt` and not in the future,
   *   the streak is measured from that reset time.
   * - Resets in the future (after `now`) are ignored as invalid data.
   * - If `now` is before or equal to the effective start instant, the streak is 0.
   *
   * Time rules:
   * - Uses UTC-based timestamps (milliseconds since epoch).
   * - Counts full elapsed 24-hour periods (not calendar days).
   * - No dependency on global time (`Date.now()` is not used).
   */
  static calculateCurrentStreakDays(input: StreakCalculationInput): number {
    const { createdAt, lastResetAt, now } = input;

    const createdAtTime: number = createdAt.getTime();
    const nowTime: number = now.getTime();

    if (Number.isNaN(createdAtTime) || Number.isNaN(nowTime)) {
      throw new Error('calculateCurrentStreakDays: Invalid Date in createdAt or now.');
    }

    // If the entity was "created" in the future relative to `now`,
    // we treat it as if the streak has not started yet.
    if (createdAtTime > nowTime) {
      return 0;
    }

    let effectiveStart: Date = createdAt;

    if (lastResetAt) {
      const lastResetTime: number = lastResetAt.getTime();

      if (Number.isNaN(lastResetTime)) {
        throw new Error('calculateCurrentStreakDays: Invalid Date in lastResetAt.');
      }

      // Ignore resets that are in the future — they are inconsistent with `now`.
      if (lastResetTime <= nowTime) {
        // If the last reset happened after the streak was created,
        // it "moves" the start of the current streak.
        if (lastResetTime > createdAtTime) {
          effectiveStart = lastResetAt;
        }
        // If lastResetTime <= createdAtTime, we keep `createdAt` as the start.
        // This covers strange or legacy data where reset is before creation.
      }
    }

    const effectiveStartTime: number = effectiveStart.getTime();

    // If the effective start is in the future or equal to now,
    // there cannot be any full elapsed days yet.
    if (effectiveStartTime >= nowTime) {
      return 0;
    }

    return getFullDaysBetween(effectiveStart, now);
  }

  /**
   * Convenience overload for calculating streak days from the Addiction aggregate.
   *
   * Uses the Addiction's `createdAt` and `lastResetAt` timestamps as inputs
   * and delegates to `calculateCurrentStreakDays`.
   */
  static calculateCurrentStreakDaysFromAddiction(addiction: Addiction, now: Date): number {
    return StreakService.calculateCurrentStreakDays({
      createdAt: addiction.createdAt,
      lastResetAt: addiction.lastResetAt,
      now,
    });
  }

  /**
   * Legacy helper: returns the already-computed `currentCount` stored on a Streak.
   * This does not perform any date-based calculation and is kept for compatibility
   * with potential existing usages of the `Streak` entity.
   */
  static calculateDays(streak: Streak): number {
    return streak.currentCount;
  }

  static isStreakActive(streak: Streak): boolean {
    return streak.isActive;
  }
}
