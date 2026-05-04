function parseLimit(value: string | null) {
  const num = Number(value);

  if (!Number.isFinite(num)) return 12;

  return Math.min(Math.max(num, 1), 50);
}