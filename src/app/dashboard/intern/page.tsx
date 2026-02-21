import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, TrendingUp, Clock } from 'lucide-react';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getInternStats(userId: string) {
    await connectToDatabase();

    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(userId);

    // FETCH DATA IN PARALLEL
    const [myTasks, completedTasks, user] = await Promise.all([
        Task.countDocuments({ assignedTo: objectId, status: { $in: ['not_started', 'in_progress', 'working'] } }),
        Task.countDocuments({ assignedTo: objectId, status: 'completed' }),
        User.findById(objectId).select('performanceScore')
    ]);

    const score = user ? user.performanceScore : 0;

    return { myTasks, completedTasks, score };
}

export default async function InternDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = await verifyToken(token || '');
    const userId = (session as any)?.id;

    const stats = await getInternStats(userId);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Intern Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Pending Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.myTasks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedTasks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.score}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
