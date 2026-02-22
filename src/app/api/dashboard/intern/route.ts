import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/jwt';
import { Types } from 'mongoose';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'intern') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = new Types.ObjectId(user.id);

        // 1. Get tasks assigned to this intern
        const tasks = await Task.find({ assignedTo: userId })
            .populate('projectId', 'name clientName')
            .sort({ deadline: 1 })
            .lean();

        // 2. Get intern stats
        const [pendingTasksCount, completedTasksCount, userData] = await Promise.all([
            Task.countDocuments({ assignedTo: userId, status: { $in: ['not_started', 'in_progress', 'working'] } }),
            Task.countDocuments({ assignedTo: userId, status: 'completed' }),
            User.findById(userId).select('performanceScore').lean()
        ]);

        console.log('[DEBUG-INTERN] Stats:', { pendingTasksCount, completedTasksCount, hasUserData: !!userData });

        return NextResponse.json({
            tasks,
            stats: {
                pendingTasks: pendingTasksCount,
                completedTasks: completedTasksCount,
                performanceScore: userData?.performanceScore || 0
            }
        });
    } catch (error: any) {
        console.error('Intern Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
