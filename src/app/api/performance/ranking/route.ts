import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';
import Task from '@/models/Task';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period'); // "2026-02"
        const internId = searchParams.get('internId');

        await connectToDatabase();

        // 1. Calculate Average Performance scores per intern
        const perfMatch: any = {};
        if (period) perfMatch.period = period;
        if (internId) perfMatch.intern = internId;

        const perfAgg = await Performance.aggregate([
            { $match: perfMatch },
            {
                $group: {
                    _id: '$intern',
                    avgScore: { $avg: '$overallScore' },
                    evalCount: { $sum: 1 }
                }
            }
        ]);

        // 2. Calculate Task completion stats per intern
        const taskAgg = await Task.aggregate([
            {
                $group: {
                    _id: '$assignedTo',
                    totalTasks: { $sum: 1 },
                    completedTasks: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    onTimeTasks: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'completed'] },
                                        { $lte: ['$updatedAt', '$deadline'] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // 3. Merge data
        const users = await User.find({ role: 'intern' }).select('name email department avatar');

        const rankings = users.map(user => {
            const perf = perfAgg.find(p => p._id.toString() === user._id.toString());
            const tasks = taskAgg.find(t => t._id.toString() === user._id.toString());

            const completionRate = tasks?.totalTasks > 0 ? (tasks.completedTasks / tasks.totalTasks) * 100 : 0;
            const punctualityRate = tasks?.completedTasks > 0 ? (tasks.onTimeTasks / tasks.completedTasks) * 100 : 0;

            // Weighting: 60% Performance Score, 30% Completion Rate, 10% punctuality
            const weightedScore = (
                ((perf?.avgScore || 0) * 0.6) +
                (completionRate * 0.3) +
                (punctualityRate * 0.1)
            ).toFixed(2);

            return {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                avgPerformance: perf?.avgScore || 0,
                completionRate: Math.round(completionRate),
                punctualityRate: Math.round(punctualityRate),
                totalTasks: tasks?.totalTasks || 0,
                weightedScore: parseFloat(weightedScore)
            };
        });

        // Sort by weighted score descending
        rankings.sort((a, b) => b.weightedScore - a.weightedScore);

        return NextResponse.json({ rankings });
    } catch (error) {
        console.error('Ranking Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
