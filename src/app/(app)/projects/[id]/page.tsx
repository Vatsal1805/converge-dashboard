'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, User as UserIcon, Loader2, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

interface Project {
    _id: string;
    name: string;
    clientName: string;
    description: string;
    status: string;
    priority: string;
    deadline: string;
    teamLeadId: { name: string; email: string };
    budget?: number;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${id}`);
                const data = await res.json();
                if (data.project) {
                    setProject(data.project);
                }
            } catch (err) {
                console.error('Failed to fetch project details', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'planning': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
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

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Project not found</h2>
                <Button asChild className="mt-4" variant="outline">
                    <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                    <p className="text-muted-foreground">{project.clientName}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 dark:text-slate-400">
                            {project.description || 'No description provided.'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            <Badge variant="outline" className={getStatusColor(project.status)}>
                                {project.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Priority</span>
                            <Badge variant="outline">{project.priority.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Deadline</span>
                            <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4" />
                                {new Date(project.deadline).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Team Lead</span>
                            <div className="flex items-center gap-1 text-sm">
                                <UserIcon className="h-4 w-4" />
                                {project.teamLeadId?.name || 'Unassigned'}
                            </div>
                        </div>
                        {project.budget && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Budget</span>
                                <span className="text-sm font-bold">${project.budget.toLocaleString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
