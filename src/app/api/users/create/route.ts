import { NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, ConflictError, handleAPIError } from '@/lib/errors';
import { userSchemas, parseBody } from '@/lib/validation';
import { audit } from '@/lib/audit';

// Helper to extract userId string from JWT payload (handles both old ObjectId buffer and new string format)
function extractUserId(id: any): string {
    if (typeof id === 'string') return id;
    if (id?.buffer) {
        // Convert buffer object to hex string
        const bytes = Object.values(id.buffer) as number[];
        return Buffer.from(bytes).toString('hex');
    }
    if (id instanceof Types.ObjectId) return id.toString();
    return String(id);
}

const createUserSchema = userSchemas.create.extend({
    role: userSchemas.create.shape.role, // teamlead or intern only
});

export async function POST(request: Request) {
    try {
        // ✅ Rate limiting
        const rateLimitResult = await rateLimit(request, {
            maxRequests: 20,
            windowMs: 15 * 60 * 1000,
        });

        if (rateLimitResult.limited) {
            return rateLimitResponse(rateLimitResult.resetTime);
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            throw new UnauthorizedError();
        }

        const session = await verifyToken(token);

        if (!session || (session as any).role !== 'founder') {
            throw new ForbiddenError('Only Founder can create users');
        }

        // ✅ Centralized validation
        const { name, email, password, role, department } = await parseBody(request, createUserSchema);

        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            department,
            createdBy: extractUserId((session as any).id),
            status: 'active',
            performanceScore: 0,
        });

        // ✅ Audit logging
        await audit.userCreated({
            creatorId: extractUserId((session as any).id),
            creatorName: (session as any).name,
            creatorRole: (session as any).role,
            newUserId: newUser._id.toString(),
            newUserData: { email, role, name },
            request,
        });

        return NextResponse.json({
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department
            }
        }, { status: 201 });

    } catch (error: unknown) {
        // ✅ Centralized error handling
        return handleAPIError(error);
    }
}
