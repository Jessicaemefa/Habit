"use client";

import {
  getTrackingIcon,
  TRACKING_ICON_NAMES,
  type TrackingIconName,
} from "@/lib/tracking-icons";

type IconPickerGridProps = {
  value: TrackingIconName;
  onChange: (name: TrackingIconName) => void;
  label?: string;
  compact?: boolean;
};

export function IconPickerGrid({
  value,
  onChange,
  label = "Icon",
  compact,
}: IconPickerGridProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">
        {label}
      </p>
      <div
        className={`grid gap-2 ${compact ? "grid-cols-6" : "grid-cols-5 sm:grid-cols-6"}`}
        role="listbox"
        aria-label={label}
      >
        {TRACKING_ICON_NAMES.map((name) => {
          const Icon = getTrackingIcon(name);
          const selected = name === value;
          return (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(name)}
              className={`flex aspect-square items-center justify-center rounded-xl border transition ${
                selected
                  ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:border-accent-amber dark:bg-accent-amber/15 dark:text-accent-amber"
                  : "border-slate-300/90 bg-white/70 text-slate-500 hover:border-slate-400 hover:text-slate-800 dark:border-white/8 dark:bg-[#111]/50 dark:text-[#888] dark:hover:border-white/20 dark:hover:text-white"
              }`}
              title={name}
            >
              <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
