'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Search, Calendar, User as UserIcon, Loader2, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { storage } from '@/lib/storage';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
    _id: string;
    name: string;
    clientName: string;
    description?: string;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    priority: 'low' | 'medium' | 'high';
    deadline: string;
    teamLeadId: { _id: string; name: string; email: string } | string;
    budget?: number;
}

interface User {
    _id: string;
    name: string;
    role: string;
}

export default function ProjectsPage() {
    const router = useRouter();
    const { user: currentUser, loading: sessionLoading } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [teamLeads, setTeamLeads] = useState<User[]>([]);

    // Edit Project State
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        clientName: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        deadline: '',
        teamLeadId: '',
        budget: 0
    });

    const fetchProjects = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const lastModified = storage.get<string>('projects_last_modified');
            const url = lastModified
                ? `/api/projects/list?since=${encodeURIComponent(lastModified)}`
                : '/api/projects/list';

            const res = await fetch(url);
            const data = await res.json();

            if (data.modified === false) {
                console.log('Projects not modified, using cache');
                setLoading(false);
                return;
            }

            const projectsList = Array.isArray(data) ? data : (data.projects || []);
            setProjects(projectsList);
            storage.set('projects_cache', projectsList);
            if (data.lastModified) {
                storage.set('projects_last_modified', data.lastModified);
            }
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamLeads = async () => {
        try {
            const res = await fetch('/api/users/list?role=teamlead');
            const data = await res.json();
            if (data.users) {
                setTeamLeads(data.users);
            }
        } catch (err) {
            console.error('Failed to fetch team leads', err);
        }
    };

    useEffect(() => {
        // Load from cache first for instant display
        const cachedProjects = storage.get<Project[]>('projects_cache');
        if (cachedProjects) {
            setProjects(cachedProjects);
            setLoading(false);
        }

        fetchProjects(!cachedProjects); // Only show loading spinner if no cache
        if (currentUser?.role === 'founder' || currentUser?.role === 'teamlead') {
            fetchTeamLeads();
        }
    }, [currentUser]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProjects(projects.filter(p => p._id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete project');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleOpenEdit = (project: Project) => {
        setEditingProject(project);
        setEditFormData({
            name: project.name,
            clientName: project.clientName,
            description: project.description || '',
            status: project.status,
            priority: project.priority,
            deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
            teamLeadId: typeof project.teamLeadId === 'object' ? project.teamLeadId._id : project.teamLeadId,
            budget: project.budget || 0
        });
        setEditDialogOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/projects/${editingProject._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editFormData,
                    budget: Number(editFormData.budget)
                }),
            });
            if (res.ok) {
                setEditDialogOpen(false);
                fetchProjects();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update project');
            }
        } catch (err) {
            console.error('Update error:', err);
        } finally {
            setUpdating(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'planning': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'on_hold': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'low': return 'text-green-600 bg-green-50 border-green-100';
            default: return '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage ongoing projects and track progress.</p>
                </div>
                {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                    <Button asChild className="text-black hover:text-black">
                        <Link href="/projects/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search projects..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-black font-bold">Project</TableHead>
                                <TableHead className="text-black font-bold">Status</TableHead>
                                <TableHead className="text-black font-bold">Priority</TableHead>
                                <TableHead className="text-black font-bold">Team Lead</TableHead>
                                <TableHead className="text-black font-bold">Deadline</TableHead>
                                <TableHead className="text-right text-black font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No projects found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => (
                                    <TableRow key={project._id} className="group">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-black">{project.name}</span>
                                                <span className="text-xs text-slate-700">{project.clientName}</span>
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
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-black">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <UserIcon className="h-3 w-3 text-slate-500" />
                                                </div>
                                                {typeof project.teamLeadId === 'object' ? project.teamLeadId.name : 'Unassigned'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-black">
                                                <Calendar className="h-3 w-3 text-slate-500" />
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-black">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => router.push(`/projects/${project._id}`)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {(currentUser?.role === 'founder' || (currentUser?.role === 'teamlead' && (typeof project.teamLeadId === 'object' ? project.teamLeadId._id : project.teamLeadId) === currentUser.id)) && (
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(project)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {currentUser?.role === 'founder' && (
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(project._id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Project Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                            <DialogDescription>Update the details for "{editingProject?.name}"</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Project Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-client">Client Name</Label>
                                    <Input
                                        id="edit-client"
                                        value={editFormData.clientName}
                                        onChange={e => setEditFormData({ ...editFormData, clientName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={editFormData.status} onValueChange={v => setEditFormData({ ...editFormData, status: v as any })}>
                                        <SelectTrigger id="edit-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planning">Planning</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="on_hold">On Hold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-priority">Priority</Label>
                                    <Select value={editFormData.priority} onValueChange={v => setEditFormData({ ...editFormData, priority: v as any })}>
                                        <SelectTrigger id="edit-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-deadline">Deadline</Label>
                                    <Input
                                        id="edit-deadline"
                                        type="date"
                                        value={editFormData.deadline}
                                        onChange={e => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-teamlead">Team Lead</Label>
                                    <Select value={editFormData.teamLeadId} onValueChange={v => setEditFormData({ ...editFormData, teamLeadId: v })}>
                                        <SelectTrigger id="edit-teamlead">
                                            <SelectValue placeholder="Select team lead" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamLeads.map(lead => (
                                                <SelectItem key={lead._id} value={lead._id}>{lead.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-budget">Budget ($)</Label>
                                <Input
                                    id="edit-budget"
                                    type="number"
                                    value={editFormData.budget}
                                    onChange={e => setEditFormData({ ...editFormData, budget: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="text-black hover:text-black">Cancel</Button>
                            <Button type="submit" disabled={updating} className="text-black hover:text-black">
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
