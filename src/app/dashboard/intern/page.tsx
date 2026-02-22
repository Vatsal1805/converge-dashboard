import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, TrendingUp, Clock } from 'lucide-react';
import { cookies } from 'next/headers';

async function getInternData(token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/dashboard/intern`, {
        headers: {
            Cookie: `auth_token=${token}`
        }
    });

    if (!res.ok) {
        return { tasks: [], stats: { pendingTasks: 0, completedTasks: 0, performanceScore: 0 } };
    }

    return res.json();
}

export default async function InternDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || '';
    const data = await getInternData(token);
    const { stats } = data;

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
                        <div className="text-2xl font-bold">{stats.pendingTasks}</div>
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
                        <div className="text-2xl font-bold">{stats.performanceScore}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
