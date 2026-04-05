import type { HabitState, TaskState } from "@/types/tracker";

/** Each habit counts as 1 (done or not); each task counts as 1. */
export function weightedCompletionPercent(
  habits: HabitState[],
  tasks: TaskState[],
): number {
  const doneHabits = habits.filter((h) => h.dailyProgress >= h.dailyGoal).length;
  const doneTasks = tasks.filter((t) => t.isCompleted).length;
  const denom = habits.length + tasks.length;
  if (denom <= 0) return 0;
  return Math.min(100, Math.round(((doneHabits + doneTasks) / denom) * 100));
}

export function habitsFullyDoneCount(habits: HabitState[]): number {
  return habits.filter((h) => h.dailyProgress >= h.dailyGoal).length;
}
