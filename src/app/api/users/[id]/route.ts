import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const { name, email, role, department, status, password } = body;

        // Check if email is being changed and if it's already in use
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 400 }
                );
            }
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (department) updateData.department = department;
        if (status) updateData.status = status;

        // Hash password if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
