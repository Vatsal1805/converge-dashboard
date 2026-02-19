import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = loginSchema.parse(body);

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.status === 'inactive') {
            return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = await signToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        });

        const response = NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
