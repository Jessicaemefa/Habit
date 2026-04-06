"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  loadAppState,
  mergeLog,
  newLogEntry,
  saveAppState,
} from "@/lib/tracker-storage";
import { toLocalDateKey } from "@/lib/date-utils";

type Appointment = {
  id: string;
  title: string;
  notes: string;
  date: string;
  time: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt?: string;
};

const APPT_KEY = "ht-appointments-v1";

function loadAppts(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPT_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Appointment[]).map((a) => ({
      ...a,
      isCompleted: a.isCompleted ?? false,
    }));
  } catch {
    return [];
  }
}

function saveAppts(items: Appointment[]) {
  localStorage.setItem(APPT_KEY, JSON.stringify(items));
}

/** Append a completion event to the shared tracker activity log. */
function logToTracker(
  kind: "appointment_completed" | "appointment_uncompleted",
  summary: string,
  appointmentId: string,
) {
  try {
    const today = toLocalDateKey(new Date());
    const state = loadAppState({
      habits: [],
      tasks: [],
      lastActiveDate: today,
      activityLog: [],
    });
    const entry = newLogEntry({ kind, summary, appointmentId });
    saveAppState({ ...state, activityLog: mergeLog(state.activityLog, entry) });
  } catch {
    /* ignore */
  }
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateTime(date: string, time: string) {
  const dt = new Date(`${date}T${time || "00:00"}`);
  return dt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isPast(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}`) < new Date();
}

// --- Skeleton ---
function AppointmentsSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-36 sm:px-6 sm:py-10 sm:pb-40">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-white/8" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200 dark:bg-white/8" />
      </div>
      <div className="mb-6 h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-white/8" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-slate-200/90 bg-white/50 dark:border-white/8 dark:bg-[#111]/50"
          />
        ))}
      </div>
    </div>
  );
}

// --- Shared form fields ---
function AppointmentForm({
  title, notes, date, time,
  onTitleChange, onNotesChange, onDateChange, onTimeChange,
  onSave, onCancel, saveLabel, autoFocus,
}: {
  title: string; notes: string; date: string; time: string;
  onTitleChange: (v: string) => void; onNotesChange: (v: string) => void;
  onDateChange: (v: string) => void; onTimeChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
  saveLabel: string; autoFocus?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">
          Title
        </label>
        <input
          autoFocus={autoFocus}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Doctor checkup"
          className="input-themed w-full"
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any details or reminders…"
          rows={3}
          className="input-themed w-full resize-none"
          onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">Date</label>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="input-themed w-full" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-muted">Time</label>
          <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className="input-themed w-full" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!title.trim() || !date}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-accent-amber"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300/90 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-muted dark:hover:border-white/25 dark:hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const NEW_ID = "new";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  const [formTitle, setFormTitle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(todayStr());
  const [formTime, setFormTime] = useState(nowTimeStr());

  useEffect(() => {
    setAppointments(loadAppts());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAppts(appointments);
  }, [appointments, ready]);

  // sorted by date/time within each group
  const dateSorted = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      ),
    [appointments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dateSorted;
    return dateSorted.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q) ||
        a.date.includes(q),
    );
  }, [dateSorted, search]);

  // pending (or mid-animation) first, settled completed last
  const displayed = useMemo(
    () => [
      ...filtered.filter((a) => !a.isCompleted || completingIds.has(a.id)),
      ...filtered.filter((a) => a.isCompleted && !completingIds.has(a.id)),
    ],
    [filtered, completingIds],
  );

  const upcomingCount = useMemo(
    () => appointments.filter((a) => !a.isCompleted && !isPast(a.date, a.time)).length,
    [appointments],
  );

  const openNew = useCallback(() => {
    setFormTitle(""); setFormNotes(""); setFormDate(todayStr()); setFormTime(nowTimeStr());
    setEditingId(NEW_ID);
  }, []);

  const openEdit = useCallback((appt: Appointment) => {
    setFormTitle(appt.title); setFormNotes(appt.notes);
    setFormDate(appt.date); setFormTime(appt.time);
    setEditingId(appt.id);
  }, []);

  const closeForm = useCallback(() => setEditingId(null), []);

  const saveForm = useCallback(() => {
    if (!formTitle.trim() || !formDate) return;
    if (editingId === NEW_ID) {
      setAppointments((prev) => [
        ...prev,
        {
          id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: formTitle.trim(),
          notes: formNotes.trim(),
          date: formDate,
          time: formTime,
          createdAt: new Date().toISOString(),
          isCompleted: false,
        },
      ]);
    } else if (editingId) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, title: formTitle.trim(), notes: formNotes.trim(), date: formDate, time: formTime }
            : a,
        ),
      );
    }
    closeForm();
  }, [editingId, formTitle, formNotes, formDate, formTime, closeForm]);

  const toggleComplete = useCallback((appt: Appointment) => {
    const nextDone = !appt.isCompleted;
    if (nextDone) {
      // slide-fade animation: keep in pending position while animating
      setCompletingIds((s) => new Set([...s, appt.id]));
      setTimeout(() => {
        setCompletingIds((s) => { const n = new Set(s); n.delete(appt.id); return n; });
      }, 420);
      logToTracker("appointment_completed", `Completed: ${appt.title}`, appt.id);
    } else {
      logToTracker("appointment_uncompleted", `Reopened: ${appt.title}`, appt.id);
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id
          ? { ...a, isCompleted: nextDone, completedAt: nextDone ? new Date().toISOString() : undefined }
          : a,
      ),
    );
  }, []);

  const deleteAppointment = useCallback(
    (id: string, title: string) => {
      if (!window.confirm(`Delete "${title}"?`)) return;
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) closeForm();
    },
    [editingId, closeForm],
  );

  if (!ready) return <AppointmentsSkeleton />;

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-8 pb-36 sm:px-6 sm:py-10 sm:pb-40">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-muted">
            {upcomingCount > 0
              ? `${upcomingCount} upcoming`
              : "No upcoming appointments."}
          </p>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#555]"
            strokeWidth={2}
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appointments…"
            className="input-themed w-full pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* New appointment inline form */}
        {editingId === NEW_ID && (
          <div className="glass-card glass-inset mb-6 rounded-2xl p-5 sm:p-6">
            <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              New Appointment
            </p>
            <AppointmentForm
              title={formTitle} notes={formNotes} date={formDate} time={formTime}
              onTitleChange={setFormTitle} onNotesChange={setFormNotes}
              onDateChange={setFormDate} onTimeChange={setFormTime}
              onSave={saveForm} onCancel={closeForm}
              saveLabel="Save appointment" autoFocus
            />
          </div>
        )}

        {/* Appointment list */}
        <section aria-label="Appointments list">
          {displayed.length === 0 && editingId !== NEW_ID ? (
            <div className="rounded-xl border border-dashed border-slate-300/80 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-muted">
              {search.trim()
                ? `No appointments match "${search}".`
                : "No appointments yet — tap New appointment below."}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {displayed.map((appt) => {
                const past = isPast(appt.date, appt.time);
                const isEditing = editingId === appt.id;
                const isCompleting = completingIds.has(appt.id);

                return (
                  <li
                    key={appt.id}
                    className={[
                      "glass-card rounded-2xl p-4 transition-all",
                      appt.isCompleted && !isEditing ? "opacity-55" : "",
                      isCompleting ? "item-completing" : "",
                    ].join(" ")}
                  >
                    {isEditing ? (
                      <>
                        <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                          Edit Appointment
                        </p>
                        <AppointmentForm
                          title={formTitle} notes={formNotes} date={formDate} time={formTime}
                          onTitleChange={setFormTitle} onNotesChange={setFormNotes}
                          onDateChange={setFormDate} onTimeChange={setFormTime}
                          onSave={saveForm} onCancel={closeForm}
                          saveLabel="Save changes" autoFocus
                        />
                      </>
                    ) : (
                      <div className="flex items-start gap-3">
                        {/* Tick / undo button */}
                        <button
                          type="button"
                          onClick={() => toggleComplete(appt)}
                          aria-pressed={appt.isCompleted}
                          aria-label={appt.isCompleted ? `Undo: ${appt.title}` : `Complete: ${appt.title}`}
                          className={[
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                            appt.isCompleted
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 dark:border-emerald-400 dark:text-emerald-400"
                              : "border-slate-400 hover:border-emerald-500 hover:text-emerald-500 dark:border-white/18 dark:hover:border-emerald-400 dark:hover:text-emerald-400",
                          ].join(" ")}
                        >
                          {appt.isCompleted ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                          ) : (
                            <RotateCcw className="h-3 w-3 opacity-0 group-hover:opacity-100" strokeWidth={2} aria-hidden />
                          )}
                        </button>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${appt.isCompleted ? "text-slate-500 line-through dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                              {appt.title}
                            </p>
                            {appt.isCompleted && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                Done
                              </span>
                            )}
                            {!appt.isCompleted && past && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/8 dark:text-[#666]">
                                Past
                              </span>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-muted">
                            <CalendarCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                            {formatDateTime(appt.date, appt.time)}
                          </p>
                          {appt.notes && (
                            <p className="mt-2 text-sm leading-snug text-slate-600 dark:text-slate-400">
                              {appt.notes}
                            </p>
                          )}
                        </div>

                        {/* Edit + Delete */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(appt)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                            aria-label={`Edit: ${appt.title}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAppointment(appt.id, appt.title)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            aria-label={`Delete: ${appt.title}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Fixed bottom button */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="pointer-events-none w-full max-w-lg bg-gradient-to-t from-[var(--page-bg)] from-40% via-[var(--page-bg)]/90 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-12">
          <button
            type="button"
            onClick={openNew}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/90 py-3.5 text-sm font-semibold text-slate-900 shadow-md backdrop-blur-md transition hover:border-amber-400/60 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-white/10 dark:bg-[#111]/95 dark:text-white dark:shadow-glass dark:hover:border-accent-amber/50"
          >
            <Plus className="h-5 w-5 text-amber-600 dark:text-accent-amber" strokeWidth={2.5} />
            New appointment
          </button>
        </div>
      </div>
    </div>
  );
}
