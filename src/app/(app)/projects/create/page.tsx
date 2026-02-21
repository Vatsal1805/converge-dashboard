'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from "date-fns"
import { cn } from "@/lib/utils"
// import { Calendar } from "@/components/ui/calendar" // Ensure calendar component exists or use native date input
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface User {
    _id: string;
    name: string;
    role: string;
}

export default function CreateProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [teamLeads, setTeamLeads] = useState<User[]>([]);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        description: '',
        teamLeadId: '',
        priority: 'medium',
        deadline: '',
        budget: 0
    });

    useEffect(() => {
        // Fetch users to populate Team Lead select
        // Need an endpoint for list users. We have /api/users/list.
        // It returns all users. We filter for team leads.
        const fetchData = async () => {
            try {
                const [usersRes, userRes] = await Promise.all([
                    fetch('/api/users/list'),
                    fetch('/api/auth/me')
                ]);
                const usersData = await usersRes.json();
                const userData = await userRes.json();

                if (userData.user && userData.user.role === 'intern') {
                    router.push('/dashboard/intern');
                    return;
                }

                if (usersData.users) {
                    const leads = usersData.users.filter((u: any) => u.role === 'teamlead');
                    setTeamLeads(leads);
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: Number(formData.budget)
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create project');
            }

            router.push('/projects');
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
                <p className="text-muted-foreground">Define project details and assign a team lead.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>Fill in the information below to start a new project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Website Redesign"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client">Client Name</Label>
                                <Input
                                    id="client"
                                    value={formData.clientName}
                                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief strict of the project scope..."
                                rows={4}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="teamLead">Assign Team Lead</Label>
                                <Select value={formData.teamLeadId} onValueChange={v => setFormData({ ...formData, teamLeadId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a team lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamLeads.map(lead => (
                                            <SelectItem key={lead._id} value={lead._id}>{lead.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="deadline">Deadline</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="text-black hover:text-black">Cancel</Button>
                            <Button type="submit" disabled={loading} className="text-black hover:text-black">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
