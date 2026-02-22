'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Calendar, User as UserIcon, Loader2, ArrowLeft, Clock, AlertTriangle, Paperclip, Download, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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
    attachments: { name: string; url: string; type: string; uploadedAt: string }[];
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [taskRes, userRes] = await Promise.all([
                    fetch(`/api/tasks/${id}`),
                    fetch('/api/auth/me')
                ]);

                const taskData = await taskRes.json();
                const userData = await userRes.json();

                if (taskData.task) setTask(taskData.task);
                if (userData.user) setCurrentUser(userData.user);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this task?')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/tasks');
            } else {
                alert('Failed to delete task');
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
        }
    };

    const handleUploadAttachment = async (name: string, url: string) => {
        try {
            const res = await fetch(`/api/tasks/${id}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url, type: url.split('.').pop() || 'file' })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.task) setTask(data.task);
            }
        } catch (err) {
            console.error('Upload error:', err);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.task) setTask(data.task);
            }
        } catch (err) {
            console.error('Status update error:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'working':
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'under_review': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'on_hold': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="pt-6 border-t mt-6 space-y-4">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-12 w-full rouned-lg" />
                                <Skeleton className="h-12 w-full rouned-lg" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Task not found</h2>
                <Button asChild className="mt-4 text-black hover:text-black" variant="outline">
                    <Link href="/tasks"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="text-black hover:text-black">
                    <Link href="/tasks"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-black">{task.title}</h2>
                    <p className="text-slate-600">{task.projectId?.name || 'Isolated Task'}</p>
                </div>
                {currentUser?.role === 'founder' && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="ml-auto text-black hover:text-black"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Task
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Task Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-800 leading-relaxed">
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

                        {/* Attachments Section */}
                        <div className="pt-6 border-t mt-6">
                            <h4 className="text-sm font-semibold text-black flex items-center gap-2 mb-4">
                                <Paperclip className="h-4 w-4" /> Attachments
                            </h4>
                            {task.attachments && task.attachments.length > 0 ? (
                                <div className="grid gap-2">
                                    {task.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded">
                                                    <Paperclip className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-black">{file.name}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{file.type}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild className="text-black hover:text-black">
                                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No files attached to this task.</p>
                            )}

                            {/* Add Attachment UI - Restricted to Founder/TeamLead */}
                            {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                                <div className="mt-4 p-4 border border-dashed rounded-lg bg-slate-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-xs font-bold uppercase text-slate-500">Upload Attachment</h5>
                                        <Button size="sm" variant="outline" className="text-black hover:text-black" onClick={() => {
                                            const name = prompt('File Name:');
                                            const url = prompt('File URL (e.g. Google Drive link):');
                                            if (name && url) {
                                                handleUploadAttachment(name, url);
                                            }
                                        }}>
                                            <Plus className="h-3 w-3 mr-1" /> Add Link
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Supported: PDF, DOCX, JPG. Max 5MB.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Status</span>
                            {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') ? (
                                <Select value={task.status} onValueChange={handleStatusUpdate}>
                                    <SelectTrigger className={`w-[130px] h-8 text-xs text-black ${getStatusColor(task.status)}`}>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_started">Not Started</SelectItem>
                                        <SelectItem value="working">Working</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge variant="outline" className={getStatusColor(task.status)}>
                                    {task.status.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Priority</span>
                            <Badge variant="outline" className="text-black border-slate-300">{task.priority.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Deadline</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                {new Date(task.deadline).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Assignee</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                                {task.assignedTo?.name || 'Unassigned'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Hours Logged</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <Clock className="h-4 w-4 text-slate-500" />
                                {task.hoursLogged || 0} hrs
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
