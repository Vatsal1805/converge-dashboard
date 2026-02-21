'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    CheckCircle2, Clock, AlertTriangle, AlertCircle, CircleDot, Loader2, Calendar, Briefcase
} from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    description?: string;
    projectId: { _id: string; name: string; clientName?: string } | null;
    assignedTo: { _id: string; name: string; email: string } | null;
    priority: 'low' | 'medium' | 'high';
    status: 'not_started' | 'in_progress' | 'working' | 'on_hold' | 'under_review' | 'completed';
    internStatus?: 'not_started' | 'started' | 'issue' | 'emergency' | 'other';
    internNote?: string;
    deadline: string;
    estimatedHours: number;
    hoursLogged: number;
    createdAt: string;
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [updateOpen, setUpdateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [newNote, setNewNote] = useState<string>('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks/list');
            const data = await res.json();
            if (data.tasks) {
                setTasks(data.tasks);
            }
        } catch (err) {
            console.error('Failed to fetch tasks', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUpdate = (task: Task) => {
        setSelectedTask(task);
        setNewStatus(task.internStatus || 'not_started');
        setNewNote(task.internNote || '');
        setUpdateOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedTask) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/tasks/${selectedTask._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    internStatus: newStatus,
                    internNote: newNote
                }),
            });

            if (res.ok) {
                setUpdateOpen(false);
                fetchTasks();
            }
        } catch (err) {
            console.error('Failed to update status', err);
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return <Badge variant="destructive">High</Badge>;
            case 'medium':
                return <Badge variant="secondary">Medium</Badge>;
            default:
                return <Badge variant="outline">Low</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
            case 'review':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Review</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">Not Started</Badge>;
        }
    };

    const getInternStatusBadge = (internStatus?: string) => {
        switch (internStatus) {
            case 'started':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CircleDot className="h-3 w-3 mr-1" />Started</Badge>;
            case 'issue':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Issue</Badge>;
            case 'emergency':
                return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Emergency</Badge>;
            case 'other':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Other</Badge>;
            default:
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Not Started</Badge>;
        }
    };

    const isOverdue = (deadline: string) => {
        return new Date(deadline) < new Date();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group tasks by status
    const todoTasks = tasks.filter(t => t.status === 'not_started');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const reviewTasks = tasks.filter(t => t.status === 'under_review');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
                <p className="text-muted-foreground">View and update your assigned tasks.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">To Do</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todoTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <CircleDot className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Review</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reviewTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Assigned Tasks</CardTitle>
                    <CardDescription>Click "Update Status" to report your progress</CardDescription>
                </CardHeader>
                <CardContent>
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
                            <p className="text-muted-foreground">You don&apos;t have any tasks assigned yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>My Status</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task._id} className={isOverdue(task.deadline) && task.status !== 'completed' ? 'bg-red-50' : ''}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{task.title}</div>
                                                {task.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {task.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{task.projectId?.name || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                                        <TableCell>{getInternStatusBadge(task.internStatus)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                <span className={isOverdue(task.deadline) && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                                                    {formatDate(task.deadline)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenUpdate(task)}
                                                disabled={task.status === 'completed'}
                                                className="text-black hover:text-black"
                                            >
                                                Update Status
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Update Status Dialog */}
            <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Task Status</DialogTitle>
                        <DialogDescription>
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_started">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Not Started
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="started">
                                        <div className="flex items-center gap-2">
                                            <CircleDot className="h-4 w-4 text-blue-500" />
                                            Started
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="issue">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            Issue
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="emergency">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            Emergency
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="other">
                                        <div className="flex items-center gap-2">
                                            Other
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Note (optional)</label>
                            <Textarea
                                placeholder="Add a note about your progress or any issues..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUpdateOpen(false)} className="text-black hover:text-black">
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={submitting} className="text-black hover:text-black">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
