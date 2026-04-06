import type { TrackingIconName } from "@/lib/tracking-icons";

export type HabitUndoSnapshot = {
  currentStreak: number;
  bestStreak: number;
  dailyProgress: number;
};

export type HabitState = {
  id: string;
  name: string;
  iconKey: TrackingIconName;
  accentEmoji: string;
  dailyGoal: number;
  dailyProgress: number;
  currentStreak: number;
  bestStreak: number;
  undoSnapshot: HabitUndoSnapshot | null;
};

export type TaskState = {
  id: string;
  text: string;
  iconKey: TrackingIconName;
  accentEmoji?: string;
  isCompleted: boolean;
};

export type ActivityKind =
  | "day_rollover"
  | "habit_completed"
  | "habit_undo"
  | "habit_created"
  | "habit_deleted"
  | "task_completed"
  | "task_uncompleted"
  | "task_created"
  | "task_deleted"
  | "appointment_completed"
  | "appointment_uncompleted";

export type ActivityEntry = {
  id: string;
  at: string;
  kind: ActivityKind;
  summary: string;
  habitId?: string;
  taskId?: string;
  appointmentId?: string;
};

export const STORAGE_VERSION = 3 as const;

export type PersistedTrackerState = {
  version: typeof STORAGE_VERSION;
  habits: HabitState[];
  tasks: TaskState[];
  lastActiveDate: string;
  activityLog: ActivityEntry[];
};
