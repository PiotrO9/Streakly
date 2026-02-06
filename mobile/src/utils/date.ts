// Date utility functions

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('pl-PL');
}

export function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Normalizes a value to a Date object.
 * Handles Date objects, ISO strings, and Unix timestamps (milliseconds).
 *
 * @param value - Date, string, or number timestamp
 * @returns Date object
 */
export function normalizeToDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value);
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  throw new Error(`Cannot normalize value to Date: ${typeof value}`);
}

/**
 * Formats elapsed time since a given date, showing the most appropriate unit.
 * Displays seconds for < 1 minute, minutes for < 1 hour, hours for < 24 hours, and days for >= 24 hours.
 *
 * @param lastResetAt - The timestamp to calculate elapsed time from (Date, string, or number)
 * @param now - The current timestamp (for testing and consistency)
 * @returns Formatted string like "34 seconds", "5 minutes", "12 hours", "23 days"
 */
export function formatElapsedTime(
  lastResetAt: Date | string | number,
  now: Date | string | number = new Date(),
): string {
  const lastResetDate = normalizeToDate(lastResetAt);
  const nowDate = normalizeToDate(now);
  const diffMs = nowDate.getTime() - lastResetDate.getTime();

  if (diffMs <= 0) {
    return '0 seconds';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return diffSeconds === 1 ? '1 second' : `${diffSeconds} seconds`;
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return diffDays === 1 ? '1 day' : `${diffDays} days`;
}
