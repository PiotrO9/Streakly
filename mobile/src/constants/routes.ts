/**
 * Navigation route name constants
 * Use these instead of string literals for type safety
 */
export const ROUTES = {
  DASHBOARD: 'Dashboard',
  ADD_ADDICTION: 'AddAddiction',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
