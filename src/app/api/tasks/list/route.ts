import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import Project from '@/models/Project';
import { Types } from 'mongoose';

export async function GET(request: Request) {
    try {
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const role = (session as any).role;
        const userId = new Types.ObjectId((session as any).id);
        const scope = searchParams.get('scope');
        console.log('[DEBUG] Tasks List API:', { userId: userId.toString(), role, scope });

        let query: any = {};

        if (scope === 'me') {
            if (role === 'intern') {
                query = { assignedTo: userId };
            } else if (role === 'teamlead') {
                // Get all projects where this user is the Team Lead
                const myProjects = await Project.find({ teamLeadId: userId }).select('_id').lean();
                const projectIds = myProjects.map(p => p._id);
                query = { projectId: { $in: projectIds } };
            }
        } else {
            // Global view (default)
            // Optional: Filters from search params could go here
        }

        const since = searchParams.get('since');

        // Check for latest modification in the results
        // Optimization: We check Task's updatedAt for intelligence
        const latestUpdate = await Task.findOne(query)
            .sort({ updatedAt: -1 })
            .select('updatedAt')
            .lean();

        const latestTimestamp = latestUpdate ? (latestUpdate as any).updatedAt.toISOString() : null;

        // If client provided 'since' and nothing changed, return early
        if (since && latestTimestamp && latestTimestamp <= since) {
            return NextResponse.json({ modified: false, lastModified: latestTimestamp });
        }

        // Performance Optimization: Use .lean() for faster execution and .select() to reduce payload size
        const [tasks, total] = await Promise.all([
            Task.find(query)
                .select('title status priority deadline projectId assignedTo internStatus internNote createdAt updatedAt description')
                .populate({
                    path: 'projectId',
                    select: 'name clientName'
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email'
                })
                .sort({ deadline: 1 })
                .skip(skip)
                .limit(limit)
                .lean(), // lean() returns plain JS objects, bypassing hydration
            Task.countDocuments(query)
        ]);

        return NextResponse.json({
            tasks,
            modified: true,
            lastModified: latestTimestamp,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Tasks Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
