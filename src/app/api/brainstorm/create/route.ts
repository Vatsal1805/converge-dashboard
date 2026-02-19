import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Brainstorm from '@/models/Brainstorm';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createPostSchema = z.object({
    content: z.string().min(1),
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
        const { content, tags } = createPostSchema.parse(body);

        await connectToDatabase();

        const post = await Brainstorm.create({
            author: (session as any).id,
            content,
            tags: tags || [],
            likes: [],
            comments: [],
        });

        const populatedPost = await Brainstorm.findById(post._id)
            .populate('author', 'name email role');

        return NextResponse.json({ post: populatedPost }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create Brainstorm Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
