// Formatting utility functions

export function formatNumber(num: number): string {
  return num.toLocaleString('pl-PL');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
