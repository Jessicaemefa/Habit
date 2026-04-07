import type {
  ActivityEntry,
  HabitState,
  PersistedTrackerState,
  TaskState,
} from "@/types/tracker";
import { STORAGE_VERSION } from "@/types/tracker";
import { normalizeIconName } from "@/lib/tracking-icons";
import { toLocalDateKey } from "@/lib/date-utils";

const STORAGE_KEY = "habit-tracker-dashboard-v1";
const MAX_LOG = 1200;

function migrateLegacyEmojiToIcon(emoji: string): string {
  const e = emoji.codePointAt(0);
  if (e === 0x1f4d6) return "BookOpen";
  if (e === 0x1f3cb) return "Dumbbell";
  if (e === 0x1f4a7) return "Droplets";
  if (e === 0x1f9d8) return "Brain";
  if (e === 0x1f9f9) return "Home";
  if (e === 0x1f6d2) return "ShoppingCart";
  return "Sparkles";
}

function normalizeHabit(raw: unknown): HabitState | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as Record<string, unknown>;
  const id = typeof h.id === "string" ? h.id : null;
  const name = typeof h.name === "string" ? h.name : null;
  if (!id || !name) return null;
  const dailyGoal = typeof h.dailyGoal === "number" && h.dailyGoal >= 1 ? h.dailyGoal : 1;
  let dailyProgress =
    typeof h.dailyProgress === "number" && h.dailyProgress >= 0 ? h.dailyProgress : 0;
  dailyProgress = Math.min(dailyGoal, dailyProgress);
  const currentStreak =
    typeof h.currentStreak === "number" && h.currentStreak >= 0 ? h.currentStreak : 0;
  const bestStreak =
    typeof h.bestStreak === "number" && h.bestStreak >= 0 ? h.bestStreak : currentStreak;

  let iconKey = normalizeIconName(
    typeof h.iconKey === "string" ? h.iconKey : undefined,
  );
  let accentEmoji = "";
  if (typeof h.accentEmoji === "string") {
    accentEmoji = h.accentEmoji;
  } else if (typeof h.emoji === "string" && h.emoji) {
    accentEmoji = h.emoji;
    if (!h.iconKey) {
      iconKey = normalizeIconName(migrateLegacyEmojiToIcon(h.emoji));
    }
  }

  let undoSnapshot: HabitState["undoSnapshot"] = null;
  if (h.undoSnapshot && typeof h.undoSnapshot === "object") {
    const u = h.undoSnapshot as Record<string, unknown>;
    if (
      typeof u.currentStreak === "number" &&
      typeof u.bestStreak === "number" &&
      typeof u.dailyProgress === "number"
    ) {
      undoSnapshot = {
        currentStreak: u.currentStreak,
        bestStreak: u.bestStreak,
        dailyProgress: Math.min(dailyGoal, Math.max(0, u.dailyProgress)),
      };
    }
  }

  return {
    id,
    name,
    iconKey,
    accentEmoji,
    dailyGoal,
    dailyProgress,
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    undoSnapshot,
  };
}

function normalizeTask(raw: unknown): TaskState | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id : null;
  const text = typeof t.text === "string" ? t.text : null;
  if (!id || !text) return null;
  const iconKey = normalizeIconName(
    typeof t.iconKey === "string" ? t.iconKey : undefined,
  );
  return {
    id,
    text,
    iconKey,
    isCompleted: Boolean(t.isCompleted),
  };
}

function normalizeActivity(raw: unknown): ActivityEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.at !== "string" || typeof e.kind !== "string") {
    return null;
  }
  if (typeof e.summary !== "string") return null;
  return {
    id: e.id,
    at: e.at,
    kind: e.kind as ActivityEntry["kind"],
    summary: e.summary,
    habitId: typeof e.habitId === "string" ? e.habitId : undefined,
    taskId: typeof e.taskId === "string" ? e.taskId : undefined,
    appointmentId: typeof e.appointmentId === "string" ? e.appointmentId : undefined,
  };
}

export type LoadedAppState = {
  habits: HabitState[];
  tasks: TaskState[];
  lastActiveDate: string;
  activityLog: ActivityEntry[];
};

function emptyState(today: string): LoadedAppState {
  return {
    habits: [],
    tasks: [],
    lastActiveDate: today,
    activityLog: [],
  };
}

function appendLog(
  log: ActivityEntry[],
  entry: Omit<ActivityEntry, "id" | "at"> & { id?: string; at?: string },
): ActivityEntry[] {
  const full: ActivityEntry = {
    id: entry.id ?? `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at ?? new Date().toISOString(),
    kind: entry.kind,
    summary: entry.summary,
    habitId: entry.habitId,
    taskId: entry.taskId,
  };
  const next = [full, ...log];
  return next.slice(0, MAX_LOG);
}

/** Reset daily habit progress; remove completed tasks. */
export function applyDayRollover(
  habits: HabitState[],
  tasks: TaskState[],
  log: ActivityEntry[],
): { habits: HabitState[]; tasks: TaskState[]; activityLog: ActivityEntry[] } {
  const clearedHabits = habits.map((h) => ({
    ...h,
    dailyProgress: 0,
    undoSnapshot: null,
  }));
  const keptTasks = tasks.filter((t) => !t.isCompleted);
  const activityLog = appendLog(log, {
    kind: "day_rollover",
    summary: "New day — habit progress reset; completed tasks cleared.",
  });
  return { habits: clearedHabits, tasks: keptTasks, activityLog };
}

export function loadAppState(fallback: LoadedAppState): LoadedAppState {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || !Array.isArray(parsed.habits) || !Array.isArray(parsed.tasks)) {
      return fallback;
    }

    const habits = parsed.habits
      .map(normalizeHabit)
      .filter((h): h is HabitState => h !== null);
    const tasks = parsed.tasks
      .map(normalizeTask)
      .filter((t): t is TaskState => t !== null);

    const version = parsed.version;
    const today = toLocalDateKey(new Date());

    let lastActiveDate =
      typeof parsed.lastActiveDate === "string" ? parsed.lastActiveDate : today;
    let activityLog: ActivityEntry[] = Array.isArray(parsed.activityLog)
      ? parsed.activityLog.map(normalizeActivity).filter((x): x is ActivityEntry => x !== null)
      : [];

    if (
      version !== STORAGE_VERSION &&
      version !== 2 &&
      version !== 1
    ) {
      return fallback;
    }

    if (version === 1 || version === 2) {
      lastActiveDate = today;
    }

    let result: LoadedAppState = {
      habits,
      tasks,
      lastActiveDate,
      activityLog,
    };

    if (result.lastActiveDate !== today) {
      const rolled = applyDayRollover(result.habits, result.tasks, result.activityLog);
      result = {
        ...result,
        habits: rolled.habits,
        tasks: rolled.tasks,
        activityLog: rolled.activityLog,
        lastActiveDate: today,
      };
      saveAppState(result);
    }

    return result;
  } catch {
    return fallback;
  }
}

export function saveAppState(state: LoadedAppState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedTrackerState = {
      version: STORAGE_VERSION,
      habits: state.habits,
      tasks: state.tasks,
      lastActiveDate: state.lastActiveDate,
      activityLog: state.activityLog,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function newLogEntry(
  partial: Omit<ActivityEntry, "id" | "at"> & { id?: string; at?: string },
): ActivityEntry {
  return {
    id: partial.id ?? `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: partial.at ?? new Date().toISOString(),
    kind: partial.kind,
    summary: partial.summary,
    habitId: partial.habitId,
    taskId: partial.taskId,
  };
}

export function mergeLog(log: ActivityEntry[], entry: ActivityEntry): ActivityEntry[] {
  return [entry, ...log].slice(0, MAX_LOG);
}

/**
 * Normalise a raw object (e.g. from cloud storage) into a validated LoadedAppState.
 * Falls back to `fallback` if the shape is unrecognisable.
 */
export function parseAppState(
  raw: unknown,
  fallback: LoadedAppState,
): LoadedAppState {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Record<string, unknown>;
  if (!Array.isArray(p.habits) || !Array.isArray(p.tasks)) return fallback;
  const today = toLocalDateKey(new Date());
  const habits = p.habits
    .map(normalizeHabit)
    .filter((h): h is HabitState => h !== null);
  const tasks = p.tasks
    .map(normalizeTask)
    .filter((t): t is TaskState => t !== null);
  const activityLog = Array.isArray(p.activityLog)
    ? p.activityLog
        .map(normalizeActivity)
        .filter((e): e is ActivityEntry => e !== null)
    : [];
  const lastActiveDate =
    typeof p.lastActiveDate === "string" ? p.lastActiveDate : today;
  return { habits, tasks, activityLog, lastActiveDate };
}

/** @deprecated use loadAppState */
export function loadTrackerState(fallback: {
  habits: HabitState[];
  tasks: TaskState[];
}): { habits: HabitState[]; tasks: TaskState[] } {
  const today = toLocalDateKey(new Date());
  const base: LoadedAppState = {
    habits: fallback.habits,
    tasks: fallback.tasks,
    lastActiveDate: today,
    activityLog: [],
  };
  const s = loadAppState(base);
  return { habits: s.habits, tasks: s.tasks };
}

/** @deprecated use saveAppState */
export function saveTrackerState(habits: HabitState[], tasks: TaskState[]): void {
  const today = toLocalDateKey(new Date());
  saveAppState({
    habits,
    tasks,
    lastActiveDate: today,
    activityLog: [],
  });
}
