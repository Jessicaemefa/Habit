"use client";

import { useUser } from "@/context/UserContext";
import { LoginScreen } from "@/components/LoginScreen";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { username, ready } = useUser();

  // Ready check is near-instant (single localStorage read in useEffect)
  if (!ready) return null;
  if (!username) return <LoginScreen />;
  return <>{children}</>;
}
