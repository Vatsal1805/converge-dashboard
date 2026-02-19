'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Search, Calendar, User as UserIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Project {
    _id: string;
    name: string;
    clientName: string;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    priority: 'low' | 'medium' | 'high';
    deadline: string;
    teamLeadId: { name: string; email: string } | string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects/list');
                const data = await res.json();
                if (data.projects) {
                    setProjects(data.projects);
                }
            } catch (err) {
                console.error('Failed to fetch projects', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

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
                <Button asChild>
                    <Link href="/projects/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search projects..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Team Lead</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    </TableCell>
                                </TableRow>
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No projects found.</TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project._id} className="group">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{project.name}</span>
                                                <span className="text-xs text-muted-foreground">{project.clientName}</span>
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
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <UserIcon className="h-3 w-3" />
                                                </div>
                                                {typeof project.teamLeadId === 'object' ? project.teamLeadId.name : 'Unassigned'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(project.deadline).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Details
                                            </Button>
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
