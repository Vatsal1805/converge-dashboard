'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Calendar, User as UserIcon, Loader2, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    deadline: string;
    assignedTo: { name: string; email: string };
    projectId: { name: string; clientName: string };
    internStatus?: string;
    internNote?: string;
    hoursLogged?: number;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                // Borrowing the list endpoint logic or assuming a GET exists (it should via [id]/route.ts if we add GET)
                // Actually [id]/route.ts only has PATCH. I should probably add GET to it or use list with filter.
                // Let's check if [id]/route.ts has GET. Wait, I didn't check GET in [id]/route.ts.
                const res = await fetch(`/api/tasks/${id}`);
                const data = await res.json();
                if (data.task) {
                    setTask(data.task);
                }
            } catch (err) {
                console.error('Failed to fetch task details', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'review': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Task not found</h2>
                <Button asChild className="mt-4" variant="outline">
                    <Link href="/tasks"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/tasks"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{task.title}</h2>
                    <p className="text-muted-foreground">{task.projectId?.name || 'Isolated Task'}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Task Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-400">
                            {task.description || 'No description provided.'}
                        </p>
                        {task.internNote && (
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Intern Note
                                </h4>
                                <p className="text-sm text-amber-800 mt-1">{task.internNote}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                                {task.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Priority</span>
                            <Badge variant="outline">{task.priority.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Deadline</span>
                            <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4" />
                                {new Date(task.deadline).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Assignee</span>
                            <div className="flex items-center gap-1 text-sm">
                                <UserIcon className="h-4 w-4" />
                                {task.assignedTo?.name || 'Unassigned'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Hours Logged</span>
                            <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4" />
                                {task.hoursLogged || 0} hrs
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
