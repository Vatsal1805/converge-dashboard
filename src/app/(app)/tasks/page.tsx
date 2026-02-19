'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Search, Calendar, User as UserIcon, Loader2, AlertTriangle, AlertCircle, CircleDot, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface Task {
    _id: string;
    title: string;
    projectId: { _id: string; name: string; clientName: string };
    assignedTo: { _id: string; name: string; email: string };
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'review' | 'completed' | 'rejected';
    internStatus?: 'not_started' | 'started' | 'issue' | 'emergency' | 'other';
    internNote?: string;
    deadline: string;
}

interface Project {
    _id: string;
    name: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        deadline: '',
        estimatedHours: 0,
    });

    // Status update handler (simplified)
    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const handleCreateTask = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/tasks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const data = await res.json();
                // Refresh tasks list
                const tasksRes = await fetch('/api/tasks/list');
                const tasksData = await tasksRes.json();
                if (tasksData.tasks) {
                    setTasks(tasksData.tasks);
                }
                setIsDialogOpen(false);
                setFormData({
                    title: '',
                    description: '',
                    projectId: '',
                    assignedTo: '',
                    priority: 'medium',
                    deadline: '',
                    estimatedHours: 0,
                });
            } else {
                const error = await res.json();
                console.error('Create task error:', error);
            }
        } catch (err) {
            console.error('Failed to create task', err);
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, projectsRes, usersRes] = await Promise.all([
                    fetch('/api/tasks/list'),
                    fetch('/api/projects/list'),
                    fetch('/api/users/list?role=intern,teamlead'),
                ]);
                
                const tasksData = await tasksRes.json();
                const projectsData = await projectsRes.json();
                const usersData = await usersRes.json();
                
                if (tasksData.tasks) setTasks(tasksData.tasks);
                if (projectsData.projects) setProjects(projectsData.projects);
                if (usersData.users) setUsers(usersData.users);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'review': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getInternStatusBadge = (internStatus?: string, internNote?: string) => {
        const noteTooltip = internNote ? ` - ${internNote}` : '';
        switch (internStatus) {
            case 'started':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200" title={`Started${noteTooltip}`}><CircleDot className="h-3 w-3 mr-1" />Started</Badge>;
            case 'issue':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" title={`Issue${noteTooltip}`}><AlertTriangle className="h-3 w-3 mr-1" />Issue</Badge>;
            case 'emergency':
                return <Badge className="bg-red-100 text-red-800 border-red-200" title={`Emergency${noteTooltip}`}><AlertCircle className="h-3 w-3 mr-1" />Emergency</Badge>;
            case 'other':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200" title={`Other${noteTooltip}`}>Other</Badge>;
            default:
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Not Started</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground">Manage your tasks and track progress.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new task.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter task title"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Task description..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="project">Project</Label>
                                    <Select
                                        value={formData.projectId}
                                        onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="assignee">Assign To</Label>
                                    <Select
                                        value={formData.assignedTo}
                                        onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(v) => setFormData({ ...formData, priority: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hours">Estimated Hours</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    min={0}
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateTask} disabled={creating || !formData.title || !formData.projectId || !formData.assignedTo}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search tasks..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task Title</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Intern Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow key="loading">
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow key="empty">
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tasks found.</TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task._id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.projectId ? task.projectId.name : 'Unknown Project'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <UserIcon className="h-3 w-3" />
                                                </div>
                                                {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(task.deadline).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.status}
                                                onValueChange={(v) => handleStatusChange(task._id, v)}
                                            >
                                                <SelectTrigger className={`w-[130px] h-8 ${getStatusColor(task.status)}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="todo">To Do</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="review">Review</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {getInternStatusBadge(task.internStatus, task.internNote)}
                                            {task.internNote && (
                                                <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={task.internNote}>
                                                    {task.internNote}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
