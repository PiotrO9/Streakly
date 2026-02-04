// Business logic for Streak operations
import type { Streak } from '../models/Streak';

export class StreakService {
  static calculateDays(streak: Streak): number {
    // Business logic for calculating streak days
    return streak.currentCount;
  }

  static isStreakActive(streak: Streak): boolean {
    return streak.isActive;
  }
}
