"use client";

import type { TaskState } from "@/types/tracker";
import { Check, Pencil, Trash2 } from "lucide-react";

type TaskItemProps = {
  task: TaskState;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: TaskItemProps) {
  return (
    <div className="group glass-card-subtle glass-inset flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:border-slate-300/80 dark:hover:border-white/15 sm:px-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-400 transition hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-white/18 dark:hover:border-white/35 dark:focus-visible:ring-accent-amber/50"
        aria-pressed={task.isCompleted}
        aria-label={
          task.isCompleted
            ? `Mark incomplete: ${task.text}`
            : `Mark complete: ${task.text}`
        }
      >
        {task.isCompleted ? (
          <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} aria-hidden />
        ) : null}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {task.accentEmoji ? (
          <span className="shrink-0 text-base leading-none" aria-hidden>
            {task.accentEmoji}
          </span>
        ) : null}
        <p
          className={`min-w-0 flex-1 text-base ${
            task.isCompleted
              ? "text-slate-500 line-through dark:text-slate-500"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {task.text}
        </p>
      </div>

      <div className="flex shrink-0 gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-slate-400 opacity-70 transition hover:text-amber-700 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-amber-400"
          aria-label={`Edit task: ${task.text}`}
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-slate-400 opacity-70 transition hover:text-red-600 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
          aria-label={`Delete task: ${task.text}`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
