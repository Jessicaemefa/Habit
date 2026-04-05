export const MILESTONES_PHASE1 = [3, 7, 14, 30, 100] as const;
/** Shown once streak has reached 100 — “next chapter” targets */
export const MILESTONES_PHASE2 = [125, 150, 200, 300, 365] as const;

export function isMilestoneActive(
  currentStreak: number,
  milestone: number,
): boolean {
  return currentStreak >= milestone;
}

export function showExtendedMilestones(currentStreak: number): boolean {
  return currentStreak >= 100;
}
