import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, CheckSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Lead from '@/models/Lead';

async function getStats() {
    await connectToDatabase();

    // FETCH DATA IN PARALLEL
    const [totalUsers, totalProjects, activeTasks, wonLeads] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments({ status: 'active' }),
        Task.countDocuments({ status: { $in: ['not_started', 'in_progress', 'under_review'] } }),
        Lead.find({ status: 'won' })
    ]);

    const revenue = wonLeads.reduce((acc, lead) => acc + (lead.dealValue || 0), 0);

    return { totalUsers, totalProjects, activeTasks, revenue };
}

export default async function FounderDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Founder Overview</h2>
                <div className="flex items-center gap-2">
                    <Button asChild className="text-black hover:text-black">
                        <Link href="/projects/create">New Project</Link>
                    </Button>
                    <Button asChild variant="secondary" className="text-black hover:text-black">
                        <Link href="/dashboard/founder/users">Manage Users</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From won leads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Total registered users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTasks}</div>
                        <p className="text-xs text-muted-foreground">Pending completion</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional sections for Recent Activity etc can be added here */}
        </div>
    );
}
