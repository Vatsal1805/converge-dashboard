import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, CheckSquare, TrendingUp, UserCheck, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

async function getStats(token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/dashboard/founder`, {
        headers: {
            Cookie: `auth_token=${token}`
        }
    });

    if (!res.ok) {
        return { totalUsers: 0, totalProjects: 0, activeTasks: 0, revenue: 0, projects: [] };
    }

    return res.json();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
    case 'active':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
    case 'on_hold':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
    case 'planning':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-100';
    case 'medium':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-100';
    default:
      return '';
  }
}

export default async function FounderDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || '';
    const data = await getStats(token);
    const { totalUsers, totalProjects, activeTasks, revenue, projects = [] } = data;

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
                        <div className="text-2xl font-bold">${revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From won leads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProjects}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Total registered users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTasks}</div>
                        <p className="text-xs text-muted-foreground">Pending completion</p>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>All Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    {projects.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No projects created yet. Create your first project to get started.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-black font-bold">Project Name</TableHead>
                                    <TableHead className="text-black font-bold">Client</TableHead>
                                    <TableHead className="text-black font-bold">Team Lead(s)</TableHead>
                                    <TableHead className="text-black font-bold">Interns</TableHead>
                                    <TableHead className="text-black font-bold">Status</TableHead>
                                    <TableHead className="text-black font-bold">Priority</TableHead>
                                    <TableHead className="text-right text-black font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project: any) => (
                                    <TableRow key={project._id}>
                                        <TableCell className="font-medium">
                                            <span className="text-sm text-black">{project.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-700">{project.clientName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <UserCheck className="h-3 w-3 text-blue-500" />
                                                <span className="text-sm text-slate-700">
                                                    {Array.isArray(project.teamLeadIds) && project.teamLeadIds.length > 0
                                                        ? project.teamLeadIds.map((lead: any) => 
                                                            typeof lead === 'object' ? lead.name : lead
                                                          ).join(', ')
                                                        : 'No Team Lead'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <UserCircle className="h-3 w-3 text-green-500" />
                                                <span className="text-sm text-slate-700">
                                                    {Array.isArray(project.members) && project.members.length > 0
                                                        ? project.members.length + " intern" + (project.members.length > 1 ? "s" : "")
                                                        : 'No Interns'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(project.status)}>
                                                {project.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getPriorityColor(project.priority)}>
                                                {project.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={"/projects/" + project._id}
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                View Details
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
