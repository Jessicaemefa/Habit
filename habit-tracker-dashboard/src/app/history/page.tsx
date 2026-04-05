"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAppState } from "@/lib/tracker-storage";
import { toLocalDateKey } from "@/lib/date-utils";
import type { ActivityEntry } from "@/types/tracker";
import { AppHeader } from "@/components/AppHeader";
import {
  Calendar,
  CheckCircle2,
  Flame,
  ListChecks,
  RefreshCw,
  Undo2,
} from "lucide-react";

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

const KIND_META: Partial<
  Record<
    ActivityEntry["kind"],
    { label: string; Icon: typeof CheckCircle2; className: string }
  >
> = {
  habit_completed: {
    label: "Habit goal met",
    Icon: CheckCircle2,
    className: "text-amber-600 dark:text-amber-400",
  },
  habit_undo: {
    label: "Habit undone",
    Icon: Undo2,
    className: "text-slate-500 dark:text-slate-400",
  },
  task_completed: {
    label: "Task done",
    Icon: ListChecks,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  task_uncompleted: {
    label: "Task reopened",
    Icon: ListChecks,
    className: "text-slate-500",
  },
  habit_created: {
    label: "Habit added",
    Icon: Flame,
    className: "text-amber-600 dark:text-orange-400",
  },
  task_created: {
    label: "Task added",
    Icon: ListChecks,
    className: "text-slate-600 dark:text-slate-400",
  },
  habit_deleted: { label: "Habit removed", Icon: RefreshCw, className: "text-red-500" },
  task_deleted: { label: "Task removed", Icon: RefreshCw, className: "text-red-500" },
  day_rollover: {
    label: "Day reset",
    Icon: RefreshCw,
    className: "text-sky-600 dark:text-sky-400",
  },
};

export default function HistoryPage() {
  const [log, setLog] = useState<ActivityEntry[]>([]);
  const [habitCount, setHabitCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = toLocalDateKey(new Date());
    const s = loadAppState({
      habits: [],
      tasks: [],
      lastActiveDate: t,
      activityLog: [],
    });
    setLog(s.activityLog);
    setHabitCount(s.habits.length);
    setTaskCount(s.tasks.length);
    setReady(true);
  }, []);

  const summary = useMemo(() => {
    let habitCompleted = 0;
    let taskCompleted = 0;
    let newDays = 0;
    for (const e of log) {
      if (e.kind === "habit_completed") habitCompleted++;
      if (e.kind === "task_completed") taskCompleted++;
      if (e.kind === "day_rollover") newDays++;
    }
    const activeDays = new Set(
      log
        .filter((e) => e.kind !== "day_rollover")
        .map((e) => toLocalDateKey(new Date(e.at))),
    ).size;
    return { habitCompleted, taskCompleted, newDays, activeDays, entries: log.length };
  }, [log]);

  const byDay = useMemo(() => activityCountByDay(log), [log]);

  const calendar = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstWd = new Date(y, m, 1).getDay();
    const dim = daysInMonth(y, m);
    const cells: { day: number | null; count: number; key: string }[] = [];
    for (let i = 0; i < firstWd; i++) {
      cells.push({ day: null, count: 0, key: `p-${i}` });
    }
    for (let d = 1; d <= dim; d++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        count: byDay.get(key) ?? 0,
        key,
      });
    }
    return { y, m, cells, label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  }, [byDay]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-slate-500 dark:text-muted">
        Loading history…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-16 sm:px-6 sm:py-10">
      <AppHeader />

      <header className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 dark:text-accent-amber">
          <Calendar className="h-8 w-8" strokeWidth={2} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            History &amp; insights
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-muted">
          Logged automatically from your habits and tasks (stored on this device).
        </p>
      </header>

      <section className="glass-card glass-inset mb-8 rounded-2xl p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          Summary
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.habitCompleted}
            </p>
            <p className="text-xs text-slate-500 dark:text-muted">Habit goals completed</p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.taskCompleted}
            </p>
            <p className="text-xs text-slate-500 dark:text-muted">Tasks checked off</p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.activeDays}
            </p>
            <p className="text-xs text-slate-500 dark:text-muted">Days with activity</p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.newDays}
            </p>
            <p className="text-xs text-slate-500 dark:text-muted">Day resets logged</p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{habitCount}</p>
            <p className="text-xs text-slate-500 dark:text-muted">Habits now</p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-white/8 dark:bg-[#111]/50">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{taskCount}</p>
            <p className="text-xs text-slate-500 dark:text-muted">Tasks now</p>
          </div>
        </div>
      </section>

      <section className="glass-card glass-inset mb-8 rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          {calendar.label}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">
              {d}
            </div>
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
          Darker cells = more logged events that day (excluding midnight resets).
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted">
          Recent activity
        </h2>
        <ul className="flex flex-col gap-2">
          {log.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-300/80 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-muted">
              No events yet. Complete a habit or task on the Today page to build history.
            </li>
          ) : (
            log.slice(0, 80).map((e) => {
              const meta = KIND_META[e.kind];
              const Icon = meta?.Icon ?? RefreshCw;
              const time = new Date(e.at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <li
                  key={e.id}
                  className="flex gap-3 rounded-xl border border-slate-200/90 bg-white/60 px-3 py-2.5 dark:border-white/8 dark:bg-[#111]/50"
                >
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
            })
          )}
        </ul>
      </section>
    </div>
  );
}
