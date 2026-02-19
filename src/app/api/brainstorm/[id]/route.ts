import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Brainstorm from '@/models/Brainstorm';
import { cookies } from 'next/headers';

export async function POST(
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
        const body = await request.json();
        const { action, content } = body;

        await connectToDatabase();

        const post = await Brainstorm.findById(id);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const userId = (session as any).id;

        if (action === 'like') {
            const likeIndex = post.likes.findIndex((l: any) => l.toString() === userId);
            if (likeIndex > -1) {
                post.likes.splice(likeIndex, 1);
            } else {
                post.likes.push(userId);
            }
            await post.save();
        } else if (action === 'comment' && content) {
            post.comments.push({
                author: userId,
                content,
                createdAt: new Date(),
            });
            await post.save();
        }

        const updatedPost = await Brainstorm.findById(id)
            .populate('author', 'name email role')
            .populate('likes', 'name')
            .populate('comments.author', 'name email');

        return NextResponse.json({ post: updatedPost });
    } catch (error) {
        console.error('Brainstorm Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
