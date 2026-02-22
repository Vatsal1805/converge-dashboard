'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'founder' | 'teamlead' | 'intern';
    department?: string;
}

interface SessionContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
    children,
    initialUser = null
}: {
    children: React.ReactNode;
    initialUser?: User | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(!initialUser);

    useEffect(() => {
        if (!initialUser) {
            const fetchUser = async () => {
                try {
                    const res = await fetch('/api/auth/me');
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                    }
                } catch (error) {
                    console.error('Failed to fetch session:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [initialUser]);

    return (
        <SessionContext.Provider value={{ user, loading, setUser }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
