import { NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

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

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['teamlead', 'intern']), // Founder cannot create another founder via API typically
    department: z.string().min(2),
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);

        if (!session || (session as any).role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden: Only Founder can create users' }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, role, department } = createUserSchema.parse(body);

        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
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

        return NextResponse.json({
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department
            }
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Create User Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
