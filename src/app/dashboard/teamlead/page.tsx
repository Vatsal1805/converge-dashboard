import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckSquare, Users } from 'lucide-react';
import { cookies } from 'next/headers';

async function getTeamLeadData(token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/dashboard/teamlead`, {
        headers: {
            Cookie: `auth_token=${token}`
        }
    });

    if (!res.ok) {
        return { projects: [], tasks: [], stats: { myActiveProjects: 0, teamActiveTasks: 0 } };
    }

    return res.json();
}

export default async function TeamLeadDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || '';
    const data = await getTeamLeadData(token);
    const { stats } = data;

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
                        <div className="text-2xl font-bold">{stats.myActiveProjects}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Active Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.teamActiveTasks}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
