"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sessionStore } from "@/services/auth/session";
import type { AuthSession } from "@/types";
export function useAuth(): {
  session: AuthSession | null;
  ready: boolean;
  logout: () => void;
} {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setSession(sessionStore.get());
    setReady(true);
  }, []);
  const logout = (): void => {
    sessionStore.clear();
    setSession(null);
    router.replace("/login");
  };
  return { session, ready, logout };
}
