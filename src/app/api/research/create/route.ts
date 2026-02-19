import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Research from '@/models/Research';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createResearchSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    fileUrl: z.string().url(),
    fileType: z.string(),
    content: z.string().optional(),
    projectId: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
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

        const body = await request.json();
        const data = createResearchSchema.parse(body);

        await connectToDatabase();

        const research = await Research.create({
            ...data,
            submittedBy: (session as any).id,
            status: 'pending',
        });

        const populated = await Research.findById(research._id)
            .populate('submittedBy', 'name email role')
            .populate('projectId', 'name');

        return NextResponse.json({ research: populated }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create Research Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
