import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckSquare, Users } from 'lucide-react';
import connectToDatabase from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getTeamLeadStats(userId: string) {
    await connectToDatabase();
    // Team Lead sees projects they lead
    const myProjects = await Project.countDocuments({ teamLeadId: userId, status: 'active' });
    // And tasks? Maybe total tasks in system or tasks assigned to them?
    // Let's show global active tasks for now as "Team Load"
    const activeTasks = await Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } });

    return { myProjects, activeTasks };
}

export default async function TeamLeadDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const session = await verifyToken(token || '');
    const userId = (session as any)?.id;

    const stats = await getTeamLeadStats(userId);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Team Lead Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.myProjects}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Active Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTasks}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
