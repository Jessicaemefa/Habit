"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const USER_KEY = "ht-username";

type UserCtx = {
  username: string | null;
  ready: boolean;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserCtx>({
  username: null,
  ready: false,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(USER_KEY);
    setUsername(saved);
    setReady(true);
  }, []);

  const login = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem(USER_KEY, trimmed);
    setUsername(trimmed);
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUsername(null);
  };

  return (
    <UserContext.Provider value={{ username, ready, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
