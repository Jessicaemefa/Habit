"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { DEFAULT_HABITS, DEFAULT_TASKS } from "@/data/initial-tracker-state";
import {
  loadAppState,
  mergeLog,
  newLogEntry,
  saveAppState,
  applyDayRollover,
} from "@/lib/tracker-storage";
import type { ActivityEntry, HabitState, TaskState } from "@/types/tracker";
import type { TrackingIconName } from "@/lib/tracking-icons";
import { setHabitDailyProgress } from "@/lib/habit-progress";
import {
  habitsFullyDoneCount,
  weightedCompletionPercent,
} from "@/lib/completion-stats";
import { toLocalDateKey } from "@/lib/date-utils";
import { HabitCard } from "@/components/HabitCard";
import { TaskItem } from "@/components/TaskItem";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { Modal } from "@/components/Modal";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { AppHeader } from "@/components/AppHeader";
import { Clock, Flame, ListTodo, Plus, Sparkles, Target, Trophy } from "lucide-react";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type HabitForm = {
  name: string;
  dailyGoal: string;
  iconKey: TrackingIconName;
  accentEmoji: string;
};

type TaskForm = {
  text: string;
};

const emptyHabitForm = (): HabitForm => ({
  name: "",
  dailyGoal: "1",
  iconKey: "Sparkles",
  accentEmoji: "",
});

const emptyTaskForm = (): TaskForm => ({
  text: "",
});

export function Dashboard() {
  const [habits, setHabits] = useState<HabitState[]>(DEFAULT_HABITS);
  const [tasks, setTasks] = useState<TaskState[]>(DEFAULT_TASKS);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [lastActiveDate, setLastActiveDate] = useState(() =>
    toLocalDateKey(new Date()),
  );
  const [storageReady, setStorageReady] = useState(false);

  const snapRef = useRef({
    habits,
    tasks,
    activityLog,
    lastActiveDate,
  });

  const [pickOpen, setPickOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [habitEditingId, setHabitEditingId] = useState<string | null>(null);
  const [taskEditingId, setTaskEditingId] = useState<string | null>(null);
  const [habitForm, setHabitForm] = useState<HabitForm>(emptyHabitForm);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);

  useEffect(() => {
    snapRef.current = { habits, tasks, activityLog, lastActiveDate };
  }, [habits, tasks, activityLog, lastActiveDate]);

  useEffect(() => {
    const today = toLocalDateKey(new Date());
    const data = loadAppState({
      habits: [],
      tasks: [],
      lastActiveDate: today,
      activityLog: [],
    });
    setHabits(data.habits);
    setTasks(data.tasks);
    setActivityLog(data.activityLog);
    setLastActiveDate(data.lastActiveDate);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveAppState({
      habits,
      tasks,
      lastActiveDate,
      activityLog,
    });
  }, [habits, tasks, activityLog, lastActiveDate, storageReady]);

  const runRolloverIfNeeded = useCallback(() => {
    const today = toLocalDateKey(new Date());
    const s = snapRef.current;
    if (s.lastActiveDate === today) return;
    const rolled = applyDayRollover(s.habits, s.tasks, s.activityLog);
    setHabits(rolled.habits);
    setTasks(rolled.tasks);
    setActivityLog(rolled.activityLog);
    setLastActiveDate(today);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const id = setInterval(runRolloverIfNeeded, 45000);
    const onVis = () => {
      if (document.visibilityState === "visible") runRolloverIfNeeded();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [storageReady, runRolloverIfNeeded]);

  const now = new Date();
  const headerWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const headerDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const totalHabits = habits.length;
  const habitsDoneToday = habitsFullyDoneCount(habits);
  const doneTasks = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;

  const doneTodayTotal = habitsDoneToday + doneTasks;
  const completionPct = weightedCompletionPercent(habits, tasks);

  const heroHabitRingProgress =
    totalHabits > 0 ? habitsDoneToday / totalHabits : 0;

  const pendingHabitItems = habits.filter((h) => h.dailyProgress < h.dailyGoal);
  const pendingTaskItems = tasks.filter((t) => !t.isCompleted);
  const totalPending = pendingHabitItems.length + pendingTaskItems.length;

  const bestStreak =
    habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak)) : 0;

  const remainingHabits = totalHabits - habitsDoneToday;
  const heroMessage =
    totalHabits === 0 && totalTasks === 0
      ? "Welcome!"
      : remainingHabits === 0 && totalHabits > 0
        ? "All done!"
        : remainingHabits === totalHabits && totalHabits > 0
          ? "Let's Start!"
          : "Keep going!";

  const heroSub =
    totalHabits === 0 && totalTasks === 0
      ? "Tap Add new below to create your first habit or task."
      : remainingHabits === 0 && totalHabits > 0
        ? "You finished every habit today."
        : `${remainingHabits} habit${remainingHabits === 1 ? "" : "s"} remaining today`;

  const closeAllModals = useCallback(() => {
    setPickOpen(false);
    setHabitModalOpen(false);
    setTaskModalOpen(false);
    setHabitEditingId(null);
    setTaskEditingId(null);
    setHabitForm(emptyHabitForm());
    setTaskForm(emptyTaskForm());
  }, []);

  const openAddDock = useCallback(() => setPickOpen(true), []);

  const startCreateHabit = useCallback(() => {
    setPickOpen(false);
    setHabitEditingId(null);
    setHabitForm(emptyHabitForm());
    setHabitModalOpen(true);
  }, []);

  const startCreateTask = useCallback(() => {
    setPickOpen(false);
    setTaskEditingId(null);
    setTaskForm(emptyTaskForm());
    setTaskModalOpen(true);
  }, []);

  const openEditHabit = useCallback(
    (id: string) => {
      const h = habits.find((x) => x.id === id);
      if (!h) return;
      setHabitEditingId(id);
      setHabitForm({
        name: h.name,
        dailyGoal: String(h.dailyGoal),
        iconKey: h.iconKey,
        accentEmoji: h.accentEmoji,
      });
      setHabitModalOpen(true);
    },
    [habits],
  );

  const openEditTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      setTaskEditingId(id);
      setTaskForm({ text: t.text });
      setTaskModalOpen(true);
    },
    [tasks],
  );

  const commitHabitProgress = useCallback((id: string, value: number) => {
    setHabits((prev) => {
      const h = prev.find((x) => x.id === id);
      if (!h) return prev;
      const wasDone = h.dailyProgress >= h.dailyGoal;
      const nextH = setHabitDailyProgress(h, value);
      const nowDone = nextH.dailyProgress >= nextH.dailyGoal;
      if (!wasDone && nowDone) {
        setActivityLog((log) =>
          mergeLog(
            log,
            newLogEntry({
              kind: "habit_completed",
              summary: `Completed daily goal: ${h.name}`,
              habitId: h.id,
            }),
          ),
        );
      } else if (wasDone && !nowDone) {
        setActivityLog((log) =>
          mergeLog(
            log,
            newLogEntry({
              kind: "habit_undo",
              summary: `Undid completion: ${h.name}`,
              habitId: h.id,
            }),
          ),
        );
      }
      return prev.map((x) => (x.id === id ? nextH : x));
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const nextDone = !t.isCompleted;
      setActivityLog((log) =>
        mergeLog(
          log,
          newLogEntry({
            kind: nextDone ? "task_completed" : "task_uncompleted",
            summary: nextDone ? `Task done: ${t.text}` : `Task reopened: ${t.text}`,
            taskId: t.id,
          }),
        ),
      );
      return prev.map((x) =>
        x.id === id ? { ...x, isCompleted: nextDone } : x,
      );
    });
  }, []);

  const deleteTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      if (!window.confirm(`Delete task "${t.text}"?`)) return;
      setActivityLog((log) =>
        mergeLog(
          log,
          newLogEntry({
            kind: "task_deleted",
            summary: `Deleted task: ${t.text}`,
            taskId: id,
          }),
        ),
      );
      setTasks((prev) => prev.filter((x) => x.id !== id));
      if (taskEditingId === id) closeAllModals();
    },
    [tasks, taskEditingId, closeAllModals],
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const h = habits.find((x) => x.id === id);
      if (!h) return;
      if (!window.confirm(`Delete habit "${h.name}"? This cannot be undone.`))
        return;
      setActivityLog((log) =>
        mergeLog(
          log,
          newLogEntry({
            kind: "habit_deleted",
            summary: `Deleted habit: ${h.name}`,
            habitId: id,
          }),
        ),
      );
      setHabits((prev) => prev.filter((x) => x.id !== id));
      if (habitEditingId === id) closeAllModals();
    },
    [habits, habitEditingId, closeAllModals],
  );

  const saveHabit = useCallback(() => {
    const name = habitForm.name.trim();
    const goal = Math.max(1, parseInt(habitForm.dailyGoal, 10) || 1);
    if (!name) return;

    if (habitEditingId) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitEditingId
            ? {
                ...h,
                name,
                dailyGoal: goal,
                dailyProgress: Math.min(h.dailyProgress, goal),
                iconKey: habitForm.iconKey,
                accentEmoji: habitForm.accentEmoji.trim(),
              }
            : h,
        ),
      );
    } else {
      const id = newId("habit");
      setHabits((prev) => [
        ...prev,
        {
          id,
          name,
          iconKey: habitForm.iconKey,
          accentEmoji: habitForm.accentEmoji.trim(),
          dailyGoal: goal,
          dailyProgress: 0,
          currentStreak: 0,
          bestStreak: 0,
          undoSnapshot: null,
        },
      ]);
      setActivityLog((log) =>
        mergeLog(
          log,
          newLogEntry({
            kind: "habit_created",
            summary: `New habit: ${name} (${goal} steps/day)`,
            habitId: id,
          }),
        ),
      );
    }
    closeAllModals();
  }, [habitForm, habitEditingId, closeAllModals]);

  const saveTask = useCallback(() => {
    const text = taskForm.text.trim();
    if (!text) return;

    if (taskEditingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskEditingId ? { ...t, text } : t,
        ),
      );
    } else {
      const id = newId("task");
      setTasks((prev) => [
        ...prev,
        {
          id,
          text,
          iconKey: "ListTodo" as const,
          isCompleted: false,
        },
      ]);
      setActivityLog((log) =>
        mergeLog(
          log,
          newLogEntry({
            kind: "task_created",
            summary: `New task: ${text}`,
            taskId: id,
          }),
        ),
      );
    }
    closeAllModals();
  }, [taskForm, taskEditingId, closeAllModals]);

  const onHabitFormKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      saveHabit();
    }
  };

  const onTaskFormKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTask();
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-8 pb-36 sm:px-6 sm:py-10 sm:pb-40">
        <AppHeader />

        <header className="mb-8" suppressHydrationWarning>
          <p className="text-sm font-medium text-slate-600 dark:text-muted">
            {headerWeekday}
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Today,{" "}
            <span className="text-amber-600 dark:text-accent-amber">
              {headerDate}
            </span>
          </h1>
        </header>

        {totalHabits === 0 && totalTasks === 0 ? (
          <div className="glass-card glass-inset mb-8 rounded-2xl p-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:p-6">
            <p className="font-semibold text-slate-900 dark:text-white">
              How it works
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Tap <strong>Add new</strong> and choose <strong>Daily habit</strong> or{" "}
                <strong>Task</strong>.
              </li>
              <li>
                <strong>Tap a habit card</strong> to mark it done — tap again to undo an
                accidental tap.
              </li>
              <li>
                <strong>Completion %</strong> is based on habits and tasks done vs. total.
              </li>
              <li>
                After <strong>100-day</strong> streaks, extra milestone targets appear.
              </li>
              <li>
                <strong>Completed tasks</strong> clear when the calendar day changes; habits
                reset progress but keep streaks.
              </li>
              <li>
                Open <strong>History</strong> for a calendar and summaries.
              </li>
            </ol>
          </div>
        ) : null}

        <section
          className="glass-card glass-inset mb-8 rounded-2xl p-5 sm:p-6"
          aria-label="Daily summary"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <CircularProgressRing
                progress={totalHabits > 0 ? heroHabitRingProgress : 0}
                size={112}
                strokeWidth={8}
                trackClassName="stroke-slate-300 dark:stroke-slate-700"
                progressClassName="stroke-amber-500 dark:stroke-accent-amber"
              >
                <span className="text-center text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  {totalHabits > 0 ? (
                    <>
                      {habitsDoneToday}
                      <span className="text-slate-500 dark:text-slate-400">/</span>
                      {totalHabits}
                    </>
                  ) : (
                    "0"
                  )}
                </span>
              </CircularProgressRing>
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  {heroMessage}
                  <Sparkles
                    className="h-5 w-5 text-amber-600 dark:text-accent-amber"
                    strokeWidth={2}
                    aria-hidden
                  />
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-muted">{heroSub}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200/90 bg-white/50 p-3 text-center dark:border-white/8 dark:bg-[#111]/50">
              <div className="flex justify-center text-amber-600 dark:text-accent-orange" aria-hidden>
                <Flame className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {bestStreak}
              </p>
              <p className="text-xs text-slate-500 dark:text-muted">Best Streak</p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-white/50 p-3 text-center dark:border-white/8 dark:bg-[#111]/50">
              <div className="flex justify-center text-emerald-600 dark:text-emerald-400" aria-hidden>
                <Target className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {doneTodayTotal}
              </p>
              <p className="text-xs text-slate-500 dark:text-muted">Done Today</p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-white/50 p-3 text-center dark:border-white/8 dark:bg-[#111]/50">
              <div className="flex justify-center text-amber-600 dark:text-accent-amber" aria-hidden>
                <Trophy className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="mt-1 text-xl font-bold text-amber-700 dark:text-accent-amber">
                {completionPct}%
              </p>
              <p className="text-xs text-slate-500 dark:text-muted">Completion</p>
            </div>
          </div>
        </section>

        {totalPending > 0 && (
          <section className="mb-6" aria-label="Pending items">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
                <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Pending
              </h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                {totalPending} left
              </span>
            </div>
            <div className="glass-card glass-inset rounded-2xl p-4 space-y-3">
              {pendingHabitItems.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                    Habits &middot; {pendingHabitItems.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingHabitItems.map((h) => (
                      <span
                        key={h.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/70 px-2.5 py-1 text-xs text-slate-700 dark:border-white/8 dark:bg-[#111]/55 dark:text-[#888]"
                      >
                        {h.accentEmoji ? (
                          <span aria-hidden>{h.accentEmoji}</span>
                        ) : null}
                        {h.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pendingTaskItems.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
                    Tasks &middot; {pendingTaskItems.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingTaskItems.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/70 px-2.5 py-1 text-xs text-slate-700 dark:border-white/8 dark:bg-[#111]/55 dark:text-[#888]"
                      >
                        {t.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-10" aria-labelledby="daily-habits-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="daily-habits-heading"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted"
            >
              Daily Habits
            </h2>
            <span className="text-sm text-slate-500 dark:text-muted">
              {habitsDoneToday}/{totalHabits}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {habits.map((habit) => (
              <li key={habit.id}>
                <HabitCard
                  habit={habit}
                  onSetProgress={(v) => commitHabitProgress(habit.id, v)}
                  onEdit={() => openEditHabit(habit.id)}
                  onDelete={() => deleteHabit(habit.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6" aria-labelledby="tasks-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="tasks-heading"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted"
            >
              Tasks / To-do
            </h2>
            <span className="text-sm text-slate-500 dark:text-muted">
              {doneTasks}/{totalTasks}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskItem
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => openEditTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="pointer-events-none w-full max-w-lg bg-gradient-to-t from-[var(--page-bg)] from-40% via-[var(--page-bg)]/90 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-12">
          <button
            type="button"
            onClick={openAddDock}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/90 py-3.5 text-sm font-semibold text-slate-900 shadow-md backdrop-blur-md transition hover:border-amber-400/60 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-white/10 dark:bg-[#111]/95 dark:text-white dark:shadow-glass dark:hover:border-accent-amber/50"
          >
            <Plus className="h-5 w-5 text-amber-600 dark:text-accent-amber" strokeWidth={2.5} />
            Add new
          </button>
        </div>
      </div>

      <Modal
        title="What would you like to add?"
        isOpen={pickOpen}
        onClose={closeAllModals}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={startCreateHabit}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/70 p-6 text-center transition hover:border-amber-400/50 hover:bg-amber-50/40 dark:border-white/10 dark:bg-[#111]/55 dark:hover:border-white/20 dark:hover:bg-[#1a1a1a]/70"
          >
            <Target className="h-10 w-10 text-amber-600 dark:text-accent-amber" strokeWidth={2} />
            <span className="font-semibold text-slate-900 dark:text-white">Daily habit</span>
            <span className="text-xs text-slate-500 dark:text-muted">
              Track streaks &amp; daily progress
            </span>
          </button>
          <button
            type="button"
            onClick={startCreateTask}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/70 p-6 text-center transition hover:border-emerald-400/50 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-[#111]/55 dark:hover:border-white/20 dark:hover:bg-[#1a1a1a]/70"
          >
            <ListTodo className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
            <span className="font-semibold text-slate-900 dark:text-white">Task / To-do</span>
            <span className="text-xs text-slate-500 dark:text-muted">One-off checklist items</span>
          </button>
        </div>
      </Modal>

      <Modal
        title={habitEditingId ? "Edit habit" : "New daily habit"}
        isOpen={habitModalOpen}
        onClose={closeAllModals}
        wide
      >
        <div className="space-y-4" onKeyDown={onHabitFormKeyDown}>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">
              Name
            </label>
            <input
              value={habitForm.name}
              onChange={(e) =>
                setHabitForm((f) => ({ ...f, name: e.target.value }))
              }
              className="input-themed w-full"
              placeholder="e.g. Morning run"
            />
          </div>


          <IconPickerGrid
            value={habitForm.iconKey}
            onChange={(iconKey) => setHabitForm((f) => ({ ...f, iconKey }))}
            label="Tracking icon"
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={saveHabit}
              disabled={!habitForm.name.trim()}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-accent-amber"
            >
              {habitEditingId ? "Save changes" : "Create habit"}
            </button>
            <button
              type="button"
              onClick={closeAllModals}
              className="rounded-xl border border-slate-300/90 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-muted dark:hover:border-white/25 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
            Tip: Ctrl+Enter saves
          </p>
        </div>
      </Modal>

      <Modal
        title={taskEditingId ? "Edit task" : "New task"}
        isOpen={taskModalOpen}
        onClose={closeAllModals}
        wide
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">
              Task
            </label>
            <input
              autoFocus
              value={taskForm.text}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, text: e.target.value }))
              }
              onKeyDown={onTaskFormKeyDown}
              className="input-themed w-full"
              placeholder="What needs doing?"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={saveTask}
              disabled={!taskForm.text.trim()}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-accent-amber"
            >
              {taskEditingId ? "Save task" : "Add task"}
            </button>
            <button
              type="button"
              onClick={closeAllModals}
              className="rounded-xl border border-slate-300/90 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-muted dark:hover:border-white/25 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
            Press Enter to save
          </p>
        </div>
      </Modal>
    </div>
  );
}
