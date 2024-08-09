export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatCurrency(arg: number) {
  return Intl.NumberFormat('en-US').format(arg)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
