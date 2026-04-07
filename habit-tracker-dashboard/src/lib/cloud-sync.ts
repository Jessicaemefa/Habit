import type { LoadedAppState } from "@/lib/tracker-storage";

export async function loadFromCloud(username: string): Promise<unknown> {
  try {
    const res = await fetch(`/api/data?user=${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const { data } = (await res.json()) as { data: unknown };
    return data ?? null;
  } catch {
    return null;
  }
}

export async function saveToCloud(
  username: string,
  state: LoadedAppState,
): Promise<void> {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: username, data: state }),
    });
  } catch {
    // silently fail — localStorage is always kept in sync as fallback
  }
}
