'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Plus, Trash2, Edit, UserCircle } from 'lucide-react';

interface User {
    _id: string;
    name: string;
    email: string;
    role?: string;
    department?: string;
    performanceScore?: number;
}

interface Team {
    _id: string;
    name: string;
    description?: string;
    teamLeadId: User;
    members: User[];
    department: string;
    status: string;
}

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamLeads, setTeamLeads] = useState<User[]>([]);
    const [interns, setInterns] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        teamLeadId: '',
        members: [] as string[],
        department: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teamsRes, usersRes, userRes] = await Promise.all([
                fetch('/api/teams/list'),
                fetch('/api/users/list'),
                fetch('/api/auth/me')
            ]);

            const teamsData = await teamsRes.json();
            const usersData = await usersRes.json();
            const userData = await userRes.json();

            if (userData.user && userData.user.role !== 'founder') {
                router.push('/dashboard');
                return;
            }

            if (teamsData.teams) setTeams(teamsData.teams);
            if (usersData.users) {
                setTeamLeads(usersData.users.filter((u: User) => u.role === 'teamlead'));
                setInterns(usersData.users.filter((u: User) => u.role === 'intern'));
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingTeam ? `/api/teams/${editingTeam._id}` : '/api/teams/create';
            const method = editingTeam ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save team');
            }

            setCreateDialogOpen(false);
            setEditingTeam(null);
            resetForm();
            fetchData();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            } else {
                alert('Failed to delete team');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const openEditDialog = (team: Team) => {
        setEditingTeam(team);
        setFormData({
            name: team.name,
            description: team.description || '',
            teamLeadId: team.teamLeadId._id,
            members: team.members.map(m => m._id),
            department: team.department
        });
        setCreateDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            teamLeadId: '',
            members: [],
            department: ''
        });
        setEditingTeam(null);
        setError('');
    };

    const toggleMember = (internId: string) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.includes(internId)
                ? prev.members.filter(id => id !== internId)
                : [...prev.members, internId]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                    <p className="text-muted-foreground">Manage teams and assign members</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={(open) => {
                    setCreateDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Team
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
                            <DialogDescription>
                                {editingTeam ? 'Update team details' : 'Assign a team lead and add members'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Frontend Development Team"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the team..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="teamlead">Team Lead</Label>
                                    <Select value={formData.teamLeadId} onValueChange={v => setFormData({ ...formData, teamLeadId: v })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team lead" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamLeads.map(lead => (
                                                <SelectItem key={lead._id} value={lead._id}>
                                                    {lead.name} ({lead.department})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Engineering"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Team Members (Interns)</Label>
                                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                                    {interns.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No interns available</p>
                                    ) : (
                                        interns.map(intern => (
                                            <div key={intern._id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`intern-${intern._id}`}
                                                    checked={formData.members.includes(intern._id)}
                                                    onCheckedChange={() => toggleMember(intern._id)}
                                                />
                                                <label
                                                    htmlFor={`intern-${intern._id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                >
                                                    {intern.name} ({intern.department})
                                                    {intern.performanceScore && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            Score: {intern.performanceScore}
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {formData.members.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {formData.members.length} member{formData.members.length > 1 ? 's' : ''} selected
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => {
                                    setCreateDialogOpen(false);
                                    resetForm();
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTeam ? 'Update Team' : 'Create Team'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map(team => (
                    <Card key={team._id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-lg">{team.name}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team._id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            {team.description && (
                                <CardDescription className="mt-2">{team.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Team Lead</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <UserCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">{team.teamLeadId.name}</span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Department</Label>
                                <Badge variant="outline" className="mt-1">{team.department}</Badge>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Members ({team.members.length})</Label>
                                <div className="mt-2 space-y-1">
                                    {team.members.slice(0, 3).map(member => (
                                        <div key={member._id} className="text-sm text-muted-foreground">
                                            • {member.name}
                                        </div>
                                    ))}
                                    {team.members.length > 3 && (
                                        <div className="text-sm text-muted-foreground">
                                            + {team.members.length - 3} more
                                        </div>
                                    )}
                                    {team.members.length === 0 && (
                                        <div className="text-sm text-muted-foreground italic">No members yet</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {teams.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first team to organize team leads and interns
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Team
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
