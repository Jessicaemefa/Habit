"use client";

import type { ReactNode } from "react";
import { ringDashValues } from "@/utils/progress-ring";

type CircularProgressRingProps = {
  progress: number;
  size: number;
  strokeWidth: number;
  trackClassName?: string;
  progressClassName?: string;
  className?: string;
  children?: ReactNode;
  /** Rotate so progress starts at top (-90deg) */
  startAtTop?: boolean;
};

export function CircularProgressRing({
  progress,
  size,
  strokeWidth,
  trackClassName = "stroke-slate-700",
  progressClassName = "stroke-accent-orange",
  className = "",
  children,
  startAtTop = true,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const { circumference, offset } = ringDashValues(radius, progress);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={startAtTop ? "-rotate-90" : ""}
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={`${progressClassName} transition-[stroke-dashoffset] duration-500 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {children ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
