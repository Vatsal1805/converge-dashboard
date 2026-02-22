import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Research from '@/models/Research';
import User from '@/models/User';
import Project from '@/models/Project';
import { cookies } from 'next/headers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectToDatabase();

        const research = await Research.findById(id)
            .populate('submittedBy', 'name email role')
            .populate('projectId', 'name')
            .populate('reviewedBy', 'name');

        if (!research) {
            return NextResponse.json({ error: 'Research not found' }, { status: 404 });
        }

        return NextResponse.json({ research });
    } catch (error) {
        console.error('Get Research Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        const role = (session as any)?.role;

        if (!session || (role !== 'founder' && role !== 'teamlead')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, reviewNotes } = body;

        await connectToDatabase();

        const research = await Research.findByIdAndUpdate(
            id,
            {
                status,
                reviewNotes,
                reviewedBy: (session as any).id,
            },
            { new: true }
        )
            .populate('submittedBy', 'name email role')
            .populate('projectId', 'name')
            .populate('reviewedBy', 'name');

        if (!research) {
            return NextResponse.json({ error: 'Research not found' }, { status: 404 });
        }

        return NextResponse.json({ research });
    } catch (error) {
        console.error('Update Research Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        const role = (session as any)?.role;

        if (!session || role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        await connectToDatabase();

        const research = await Research.findByIdAndDelete(id);

        if (!research) {
            return NextResponse.json({ error: 'Research not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Research deleted successfully' });
    } catch (error) {
        console.error('Delete Research Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
