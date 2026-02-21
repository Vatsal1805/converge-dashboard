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
