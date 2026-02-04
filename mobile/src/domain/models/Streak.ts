// Domain model for Streak entity

export interface Streak {
  id: string;
  name: string;
  startDate: Date;
  currentCount: number;
  longestCount: number;
  isActive: boolean;
}
