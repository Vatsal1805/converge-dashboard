import { User, Role } from '@/data/types';
import bcrypt from 'bcryptjs';

const USERS_KEY = 'converge_users';
const SESSION_KEY = 'converge_session';
const SALT_ROUNDS = 10;

// Token interface
interface AuthToken {
    userId: string;
    email: string;
    role: Role;
    expiresAt: number;
}

// Initialize and Seed Founder
export const seedFounder = () => {
    const existingUsers = getStoredUsers();
    const founderExists = existingUsers.some(u => u.role === 'founder');

    if (!founderExists) {
        const hashedPassword = bcrypt.hashSync('convergedigitals', SALT_ROUNDS);

        const founder: User = {
            id: 'founder-001',
            name: 'Founder',
            email: 'founder@gmail.com',
            role: 'founder',
            avatar: 'F',
            department: 'Executive',
            joinedAt: new Date().toISOString(),
            password: hashedPassword,
            status: 'active',
            createdBy: 'system'
        };

        saveUsers([...existingUsers, founder]);
        console.log('Founder seeded successfully');
    }
};

// User Storage Helpers
export const getStoredUsers = (): User[] => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error('Failed to load users', e);
        return [];
    }
};

export const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email: string): User | undefined => {
    const users = getStoredUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

// Password Helpers
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, SALT_ROUNDS);
};

export const comparePassword = (password: string, hash: string): boolean => {
    return bcrypt.compareSync(password, hash);
};

// Session Management
export const createSession = (user: User) => {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const token: AuthToken = {
        userId: user.id,
        email: user.email,
        role: user.role,
        expiresAt
    };

    // In a real app, this would be an httpOnly cookie
    // Here we encode it as base64 to look like a token
    const tokenString = btoa(JSON.stringify(token));
    localStorage.setItem(SESSION_KEY, tokenString);

    // Update last login
    const users = getStoredUsers();
    const updatedUsers = users.map(u =>
        u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    saveUsers(updatedUsers);

    return tokenString;
};

export const getSession = (): AuthToken | null => {
    const tokenString = localStorage.getItem(SESSION_KEY);
    if (!tokenString) return null;

    try {
        const token: AuthToken = JSON.parse(atob(tokenString));
        if (Date.now() > token.expiresAt) {
            clearSession();
            return null;
        }
        return token;
    } catch (e) {
        clearSession();
        return null;
    }
};

export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};
