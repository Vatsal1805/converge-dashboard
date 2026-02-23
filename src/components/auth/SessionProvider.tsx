"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "@/lib/storage";

interface User {
  id: string;
  email: string;
  name: string;
  role: "founder" | "teamlead" | "intern";
  department?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  timezone?: string;
  profileCompleted?: boolean;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    // Load from cache first
    if (!initialUser) {
      const cachedUser = storage.get<User>("user_session");
      if (cachedUser) {
        setUser(cachedUser);
      }
    }

    if (!initialUser) {
      const fetchUser = async () => {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (data.user) {
            // If user ID changed, clear other caches to prevent leakage
            const currentSession = storage.get<User>("user_session");
            if (currentSession && currentSession.id !== data.user.id) {
              storage.remove("tasks_cache");
              storage.remove("projects_cache");
              storage.remove("tasks_last_modified");
              storage.remove("projects_last_modified");
            }
            setUser(data.user);
            storage.set("user_session", data.user);
          } else {
            // Clear cache if session is actually invalid
            storage.remove("user_session");
            storage.remove("tasks_cache");
            storage.remove("projects_cache");
          }
        } catch (error) {
          console.error("Failed to fetch session:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      storage.set("user_session", initialUser);
      setLoading(false);
    }
  }, [initialUser]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        storage.set("user_session", data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user session:", error);
    }
  };

  return (
    <SessionContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
