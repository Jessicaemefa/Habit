"use client";

import { useState, type KeyboardEvent } from "react";
import { useUser } from "@/context/UserContext";
import { ArrowRight, User } from "lucide-react";

export function LoginScreen() {
  const { login } = useUser();
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    login(trimmed);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="glass-card glass-inset w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          {/* <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 dark:bg-amber-400/10">
            <User className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={2} />
          </div> */}
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Welcome
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted">
            Enter your name to load your habits and tasks.
          </p>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            className="input-themed w-full"
            placeholder="Your name"
            maxLength={40}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-accent-amber"
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-600">
          No password needed — your name is your key.
        </p> */}
      </div>
    </div>
  );
}
