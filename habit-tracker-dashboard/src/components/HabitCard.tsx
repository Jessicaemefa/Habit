"use client";

import type { HabitState } from "@/types/tracker";
import {
  MILESTONES_PHASE1,
  MILESTONES_PHASE2,
  isMilestoneActive,
  showExtendedMilestones,
} from "@/lib/milestones";
import { getTrackingIcon } from "@/lib/tracking-icons";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { Check, Flame, Pencil, RotateCcw, Trash2 } from "lucide-react";

type HabitCardProps = {
  habit: HabitState;
  onSetProgress: (value: number) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function HabitCard({
  habit,
  onSetProgress,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const doneToday = habit.dailyProgress >= habit.dailyGoal;
  const CenterIcon = getTrackingIcon(habit.iconKey);
  const extended = showExtendedMilestones(habit.currentStreak);

  const handleToggle = () => {
    if (doneToday) {
      onSetProgress(habit.undoSnapshot?.dailyProgress ?? 0);
    } else {
      onSetProgress(habit.dailyGoal);
    }
  };

  const badgeCls = (active: boolean) =>
    `shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold transition-colors ${
      active
        ? "bg-amber-500 text-slate-900 dark:bg-accent-amber dark:text-slate-900"
        : "border border-slate-300/90 bg-slate-100/80 text-slate-500 dark:border-white/10 dark:bg-[#111]/60 dark:text-[#888]"
    }`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={`glass-card glass-inset flex w-full cursor-pointer flex-row items-start gap-3 rounded-2xl p-4 transition sm:p-5 ${
        doneToday
          ? "border-amber-400/60 bg-amber-50/20 dark:border-amber-500/30 dark:bg-amber-500/5"
          : "hover:border-slate-300/80 dark:hover:border-white/12"
      }`}
    >
      {/* Ring */}
      <div className="shrink-0 pt-0.5">
        <CircularProgressRing
          progress={doneToday ? 1 : 0}
          size={56}
          strokeWidth={4}
          trackClassName="stroke-slate-300 dark:stroke-white/10"
          progressClassName={
            doneToday ? "stroke-emerald-500" : "stroke-accent-orange"
          }
        >
          {doneToday ? (
            <Check className="h-5 w-5 text-emerald-500" strokeWidth={2.5} aria-hidden />
          ) : (
            <CenterIcon className="h-6 w-6 text-slate-700 dark:text-white" strokeWidth={2} aria-hidden />
          )}
        </CircularProgressRing>
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Name + done badge */}
        <div className="flex flex-wrap items-center gap-1.5">
          {habit.accentEmoji ? (
            <span className="text-lg leading-none" aria-hidden>
              {habit.accentEmoji}
            </span>
          ) : null}
          <p className="truncate font-semibold text-slate-900 dark:text-white">
            {habit.name}
          </p>
          {doneToday && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              Done
            </span>
          )}
        </div>

        {/* Streak + milestones — single scrollable row, never wraps */}
        <div
          className="mt-1.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none"
          role="list"
          aria-label="Streak and milestones"
        >
          <span
            className="shrink-0 inline-flex items-center gap-1 text-sm text-accent-orange"
            role="listitem"
            aria-label={`${habit.currentStreak} day streak`}
          >
            <Flame className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span>{habit.currentStreak}</span>
          </span>
          <span className="shrink-0 select-none text-slate-300 dark:text-white/15" aria-hidden>
            ·
          </span>
          {MILESTONES_PHASE1.map((m) => (
            <span key={m} role="listitem" className={badgeCls(isMilestoneActive(habit.currentStreak, m))}>
              {m}
            </span>
          ))}
          {extended &&
            MILESTONES_PHASE2.map((m) => (
              <span key={m} role="listitem" className={badgeCls(isMilestoneActive(habit.currentStreak, m))}>
                {m}
              </span>
            ))}
        </div>

        {doneToday && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/30">
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            Tap to undo
          </p>
        )}
      </div>

      {/* Edit / Delete */}
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/80 hover:text-amber-700 dark:text-white/30 dark:hover:bg-white/6 dark:hover:text-amber-400"
          aria-label={`Edit ${habit.name}`}
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/80 hover:text-red-600 dark:text-white/30 dark:hover:bg-white/6 dark:hover:text-red-400"
          aria-label={`Delete ${habit.name}`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
