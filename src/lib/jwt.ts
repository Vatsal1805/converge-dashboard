import { SignJWT, jwtVerify } from 'jose';

const secretStr = process.env.JWT_SECRET || 'dev_secret_key_123';
const JWT_SECRET = new TextEncoder().encode(secretStr);
const ALG = 'HS256';

export async function signToken(payload: any): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
    try {
        if (!token) return null;
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * Performance optimized helper to get user data from request.
 * Priorities:
 * 1. x-user-data header (set by middleware, base64 encoded JSON)
 * 2. auth_token cookie (fallback, requires JWT verification)
 */
export async function getUserFromRequest(request: Request | any) {
    // 1. Check for header (fastest, pre-decoded by middleware)
    const headerData = request.headers instanceof Headers
        ? request.headers.get('x-user-data')
        : request.headers?.['x-user-data'];

    if (headerData) {
        try {
            // Using atob and JSON.parse for wide compatibility
            return JSON.parse(atob(headerData));
        } catch (e) {
            console.error('Failed to parse user data from header:', e);
        }
    }

    // 2. Fallback to cookie verification
    // This is useful if the route is called directly or middleware is bypassed
    const cookieHeader = request.headers instanceof Headers
        ? request.headers.get('cookie')
        : request.headers?.['cookie'];

    const token = cookieHeader?.split(';')
        .find((c: string) => c.trim().startsWith('auth_token='))
        ?.split('=')[1];

    if (token) {
        return verifyToken(token);
    }

    return null;
}
