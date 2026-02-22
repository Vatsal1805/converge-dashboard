'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, User as UserIcon, Loader2, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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
    const router = useRouter();
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, userRes] = await Promise.all([
                    fetch(`/api/projects/${id}`),
                    fetch('/api/auth/me')
                ]);
                const projData = await projRes.json();
                const userData = await userRes.json();

                if (projData.project) setProject(projData.project);
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
        if (!confirm('Are you sure you want to permanently delete this project? This will NOT delete associated tasks but they will lose their project reference.')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/projects');
            } else {
                alert('Failed to delete project');
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
        }
    };

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
                        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
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

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Project not found</h2>
                <Button asChild className="mt-4 text-black hover:text-black" variant="outline">
                    <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="text-black hover:text-black">
                    <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-black">{project.name}</h2>
                    <p className="text-slate-600">{project.clientName}</p>
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
                        Delete Project
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-800 leading-relaxed">
                            {project.description || 'No description provided.'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Status</span>
                            <Badge variant="outline" className={getStatusColor(project.status)}>
                                {project.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Priority</span>
                            <Badge variant="outline" className="text-black border-slate-300">{project.priority.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Deadline</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                {new Date(project.deadline).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Team Lead</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                                {project.teamLeadId?.name || 'Unassigned'}
                            </div>
                        </div>
                        {project.budget && (
                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                <span className="text-sm font-semibold text-slate-700">Budget</span>
                                <span className="text-sm font-bold text-black">${project.budget.toLocaleString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
