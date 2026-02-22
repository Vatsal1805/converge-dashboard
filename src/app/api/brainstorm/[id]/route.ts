import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Brainstorm from '@/models/Brainstorm';
import User from '@/models/User';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getUserFromRequest(request);
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
            .populate('author', 'name email role department')
            .populate('likes', 'name')
            .populate('comments.author', 'name email');

        return NextResponse.json({ post: updatedPost });
    } catch (error) {
        console.error('Brainstorm Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getUserFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectToDatabase();

        const post = await Brainstorm.findById(id).populate('author', 'department').lean();
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const userId = (session as any).id;
        const userRole = (session as any).role;

        let canDelete = false;

        if (userRole === 'founder') {
            canDelete = true;
        } else if (userRole === 'intern') {
            // Intern can delete only their own posts
            canDelete = post.author._id.toString() === userId;
        } else if (userRole === 'teamlead') {
            // Team lead can delete if author is in the same department
            const currentUser = await User.findById(userId).select('department').lean();
            if (currentUser && post.author && (post.author as any).department === currentUser.department) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this post' }, { status: 403 });
        }

        await Brainstorm.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Brainstorm Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
