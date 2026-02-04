// Navigation route constants

export const ROUTES = {
  HOME: 'Home',
  STREAK: 'Streak',
  SETTINGS: 'Settings',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
