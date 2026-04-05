import type { HabitState } from "@/types/tracker";

/** Apply new daily progress (clamped). Handles streak snapshot when crossing goal / undo. */
export function setHabitDailyProgress(
  h: HabitState,
  rawNext: number,
): HabitState {
  const next = Math.max(
    0,
    Math.min(h.dailyGoal, Math.round(Number.isFinite(rawNext) ? rawNext : 0)),
  );
  const wasDone = h.dailyProgress >= h.dailyGoal;
  const nowDone = next >= h.dailyGoal;

  if (wasDone && !nowDone) {
    if (!h.undoSnapshot) {
      return { ...h, dailyProgress: next };
    }
    return {
      ...h,
      currentStreak: h.undoSnapshot.currentStreak,
      bestStreak: h.undoSnapshot.bestStreak,
      dailyProgress: next,
      undoSnapshot: null,
    };
  }

  if (!wasDone && nowDone) {
    const snapshot = {
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      dailyProgress: h.dailyProgress,
    };
    const newStreak = h.currentStreak + 1;
    return {
      ...h,
      dailyProgress: next,
      undoSnapshot: snapshot,
      currentStreak: newStreak,
      bestStreak: Math.max(h.bestStreak, newStreak),
    };
  }

  return { ...h, dailyProgress: next };
}

export function applyHabitDelta(h: HabitState, delta: number): HabitState {
  return setHabitDailyProgress(h, h.dailyProgress + delta);
}
