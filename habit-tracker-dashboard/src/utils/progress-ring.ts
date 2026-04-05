/** SVG circle stroke math for dasharray / dashoffset progress (0-1). */
export function ringDashValues(
  radius: number,
  progress: number,
): { circumference: number; offset: number } {
  const clamped = Math.min(1, Math.max(0, progress));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  return { circumference, offset };
}
