import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '@/data/types';
import {
    seedFounder,
    getStoredUsers,
    saveUsers,
    findUserByEmail,
    comparePassword,
    createSession,
    getSession,
    clearSession,
    hashPassword
} from '@/lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    currentUser: User | null;
    currentRole: Role | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    createUser: (userData: Omit<User, 'id' | 'createdAt' | 'joinedAt'>) => Promise<boolean>;
    setRole: (role: Role) => void; // Kept for backward compat / debug
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Initial load
    useEffect(() => {
        const initAuth = async () => {
            seedFounder(); // Ensure founder exists

            const session = getSession();
            if (session) {
                const users = getStoredUsers();
                const user = users.find(u => u.id === session.userId);

                if (user && user.status === 'active') {
                    setCurrentUser(user);
                } else {
                    clearSession();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = findUserByEmail(email);

        if (!user) {
            toast.error('Invalid credentials');
            setIsLoading(false);
            return false;
        }

        if (user.status === 'inactive') {
            toast.error('Account is inactive. Contact administrator.');
            setIsLoading(false);
            return false;
        }

        // Since we are seeding mock users without passwords initially in some cases,
        // we might need to handle legacy/mock users vs seeded users.
        // For this strict implementation, we expect a password hash.
        // If mock user has no password field, we can't login (except Founder who is seeded).
        // Let's assume seeded users have passwords.

        if (!user.password) {
            // Fallback for mock users that weren't properly seeded with passwords
            // In a real scenario, we'd force a password reset.
            // For this demo, check against a default if needed, or just fail.
            if (email === 'founder@gmail.com' && password === 'convergedigitals') {
                // Special loophole for dev if seed failed to overwrite? 
                // Should not happen if seedFounder works correctly.
            }
            toast.error('Account configuration error');
            setIsLoading(false);
            return false;
        }

        const isValid = comparePassword(password, user.password);

        if (!isValid) {
            toast.error('Invalid credentials');
            setIsLoading(false);
            return false;
        }

        createSession(user);
        setCurrentUser(user);
        setIsLoading(false);
        toast.success(`Welcome back, ${user.name}`);
        return true;
    };

    const logout = () => {
        clearSession();
        setCurrentUser(null);
        navigate('/login');
        toast.info('Logged out successfully');
    };

    const createUser = async (userData: Omit<User, 'id' | 'joinedAt'>): Promise<boolean> => {
        // Only founder can create users (enforced by route guard too)
        if (currentUser?.role !== 'founder') {
            toast.error('Unauthorized');
            return false;
        }

        const existing = findUserByEmail(userData.email);
        if (existing) {
            toast.error('Email already exists');
            return false;
        }

        const newUser: User = {
            ...userData,
            id: crypto.randomUUID(),
            joinedAt: new Date().toISOString(),
            avatar: userData.name.charAt(0).toUpperCase(),
        };

        const users = getStoredUsers();
        saveUsers([...users, newUser]);

        toast.success('User created successfully');
        return true;
    };

    // COMPATIBILITY: Existing components use setRole
    // In a real auth system, you don't just "set role", you login as a different user.
    // We will deprecate this or make it a dev-only tool if needed.
    // For now, it will do nothing or log a warning.
    const setRole = (role: Role) => {
        console.warn('setRole is deprecated in full auth mode. Use login/logout.');
    };

    const value = {
        currentUser,
        currentRole: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        createUser,
        setRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Compatibility hook for existing code
export function useRole() {
    const { currentUser, setRole } = useAuth();
    return {
        currentRole: currentUser?.role || 'intern', // Fallback to safe role if not logged in (though should be redirected)
        currentUser: currentUser!,
        setRole
    };
}
