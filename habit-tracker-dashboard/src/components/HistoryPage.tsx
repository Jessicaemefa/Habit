"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAppState, saveAppState } from "@/lib/tracker-storage";
import { toLocalDateKey } from "@/lib/date-utils";
import type { ActivityEntry } from "@/types/tracker";
import {
  // CalendarCheck, // appointments commented out
  CheckCircle2,
  Flame,
  ListChecks,
  RefreshCw,
  Undo2,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

// ─── helpers ─────────────────────────────────────────────────────────────────
function activityCountByDay(log: ActivityEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of log) {
    if (e.kind === "day_rollover") continue;
    const k = toLocalDateKey(new Date(e.at));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function daysInMonth(y: number, m0: number): number {
  return new Date(y, m0 + 1, 0).getDate();
}

function isWithin2Days(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() < TWO_DAYS_MS;
}

// ─── kind metadata ────────────────────────────────────────────────────────────
const KIND_META: Partial<
  Record<
    ActivityEntry["kind"],
    { label: string; Icon: typeof CheckCircle2; className: string }
  >
> = {
  habit_completed:  { label: "Habit goal met",  Icon: CheckCircle2, className: "text-amber-600 dark:text-amber-400" },
  habit_undo:       { label: "Habit undone",    Icon: Undo2,        className: "text-slate-500 dark:text-slate-400" },
  task_completed:   { label: "Task done",       Icon: ListChecks,   className: "text-emerald-600 dark:text-emerald-400" },
  task_uncompleted: { label: "Task reopened",   Icon: ListChecks,   className: "text-slate-500" },
  habit_created:    { label: "Habit added",     Icon: Flame,        className: "text-amber-600 dark:text-orange-400" },
  task_created:     { label: "Task added",      Icon: ListChecks,   className: "text-slate-600 dark:text-slate-400" },
  habit_deleted:    { label: "Habit removed",   Icon: RefreshCw,    className: "text-red-500" },
  task_deleted:     { label: "Task removed",    Icon: RefreshCw,    className: "text-red-500" },
  day_rollover:     { label: "Day reset",       Icon: RefreshCw,    className: "text-sky-600 dark:text-sky-400" },
  // appointment_completed:   { label: "Appointment done",     Icon: CalendarCheck, className: "text-emerald-600 dark:text-emerald-400" },
  // appointment_uncompleted: { label: "Appointment reopened", Icon: CalendarCheck, className: "text-slate-500 dark:text-slate-400" },
};

// ─── activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ e }: { e: ActivityEntry }) {
  const meta = KIND_META[e.kind];
  const Icon = meta?.Icon ?? RefreshCw;
  const time = new Date(e.at).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  return (
    <li className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/60 px-3 py-2.5 dark:border-white/8 dark:bg-[#111]/50">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${meta?.className ?? "text-slate-400"}`}
        strokeWidth={2}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-900 dark:text-white">{e.summary}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-500">
          {meta?.label ?? e.kind} · {time}
        </p>
      </div>
    </li>
  );
}

// ─── lazy loader — runs synchronously on first client render (ssr: false) ────
function loadInitialHistory() {
  const today = toLocalDateKey(new Date());
  const s = loadAppState({ habits: [], tasks: [], lastActiveDate: today, activityLog: [] });
  const pruned = s.activityLog.filter((e) => isWithin2Days(e.at));
  return {
    log: pruned,
    habitCount: s.habits.length,
    taskCount: s.tasks.length,
    bestStreak: s.habits.length > 0 ? Math.max(...s.habits.map((h) => h.bestStreak)) : 0,
    needsPrune: pruned.length !== s.activityLog.length,
    fullState: s,
  };
}

// ─── component ────────────────────────────────────────────────────────────────
export function HistoryPage() {
  // Lazy sync init — no skeleton, no flash
  const [init] = useState(loadInitialHistory);
  const [log] = useState(init.log);
  const [habitCount] = useState(init.habitCount);
  const [taskCount] = useState(init.taskCount);
  const [bestStreak] = useState(init.bestStreak);

  // Prune old entries (side-effect, can't run during render)
  useEffect(() => {
    if (init.needsPrune) {
      saveAppState({ ...init.fullState, activityLog: init.log });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => {
    let habitCompleted = 0, taskCompleted = 0, newDays = 0;
    // let apptCompleted = 0; // appointments commented out
    for (const e of log) {
      if (e.kind === "habit_completed") habitCompleted++;
      if (e.kind === "task_completed") taskCompleted++;
      // if (e.kind === "appointment_completed") apptCompleted++;
      if (e.kind === "day_rollover") newDays++;
    }
    const activeDays = new Set(
      log.filter((e) => e.kind !== "day_rollover").map((e) => toLocalDateKey(new Date(e.at))),
    ).size;
    return { habitCompleted, taskCompleted, newDays, activeDays };
  }, [log]);

  const byDay = useMemo(() => activityCountByDay(log), [log]);

  const calendar = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const firstWd = new Date(y, m, 1).getDay();
    const dim = daysInMonth(y, m);
    const cells: { day: number | null; count: number; key: string }[] = [];
    for (let i = 0; i < firstWd; i++) cells.push({ day: null, count: 0, key: `p-${i}` });
    for (let d = 1; d <= dim; d++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, count: byDay.get(key) ?? 0, key });
    }
    return { y, m, cells, label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  }, [byDay]);

  const recentActivity = useMemo(
    () => log.filter((e) => e.kind !== "day_rollover"),
    [log],
  );

  const completedTasks = useMemo(
    () => log.filter((e) => e.kind === "task_completed"),
    [log],
  );
  // const completedAppts = useMemo(
  //   () => log.filter((e) => e.kind === "appointment_completed"),
  //   [log],
  // );

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-16 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          History &amp; insights
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-muted">
          Shows the last 48 hours — older entries are cleared automatically.
        </p>
      </header>

      {/* ── Summary ── */}
      <section className="glass-card glass-inset mb-8 rounded-2xl p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          Summary
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { value: summary.habitCompleted, label: "Habit goals met" },
            { value: summary.taskCompleted,  label: "Tasks checked off" },
            { value: bestStreak,             label: "Best streak" },
            { value: summary.activeDays,     label: "Days with activity" },
            { value: habitCount,             label: "Habits now" },
            { value: taskCount,              label: "Tasks now" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50"
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Calendar ── */}
      <section className="glass-card glass-inset mb-8 rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          {calendar.label}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">{d}</div>
          ))}
          {calendar.cells.map((c) =>
            c.day === null ? (
              <div key={c.key} className="aspect-square" />
            ) : (
              <div
                key={c.key}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold ${
                  c.count === 0
                    ? "bg-slate-100/80 text-slate-400 dark:bg-[#111]/55 dark:text-[#444]"
                    : c.count < 3
                      ? "bg-amber-200/80 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200"
                      : c.count < 6
                        ? "bg-amber-300/90 text-amber-950 dark:bg-amber-500/40 dark:text-amber-100"
                        : "bg-amber-500 text-slate-900 dark:bg-accent-amber dark:text-slate-900"
                }`}
                title={`${c.key}: ${c.count} events`}
              >
                {c.day}
              </div>
            ),
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
          Darker cells = more logged events that day.
        </p>
      </section>

      {/* ── Completed (tasks) ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          Completed
        </h2>
        {completedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300/80 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-muted">
            No completions logged in the last 48 hours.
          </div>
        ) : (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <ListChecks className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Completed Tasks &middot; {completedTasks.length}
            </p>
            <ul className="flex flex-col gap-2">
              {completedTasks.map((e) => <ActivityRow key={e.id} e={e} />)}
            </ul>
          </div>
        )}
      </section>

      {/* ── Recent Activity ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          Recent Activity
        </h2>
        <ul className="flex flex-col gap-2">
          {recentActivity.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-300/80 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-muted">
              No events in the last 48 hours.
            </li>
          ) : (
            recentActivity.slice(0, 60).map((e) => <ActivityRow key={e.id} e={e} />)
          )}
        </ul>
      </section>
    </div>
  );
}
