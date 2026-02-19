'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Mail, Building2, Crown, Shield, User as UserIcon } from 'lucide-react';

interface TeamMember {
    _id: string;
    name: string;
    email: string;
    role: 'founder' | 'teamlead' | 'intern';
    department: string;
    status: 'active' | 'inactive';
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/users/list');
                const data = await res.json();
                if (data.users) {
                    // Only show active users
                    setMembers(data.users.filter((u: TeamMember) => u.status === 'active'));
                }
            } catch (err) {
                console.error('Failed to fetch team', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    // Get unique departments
    const departments = [...new Set(members.map(m => m.department))];

    // Filter members
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
        return matchesSearch && matchesRole && matchesDepartment;
    });

    // Group by role for stats
    const founders = members.filter(m => m.role === 'founder');
    const teamleads = members.filter(m => m.role === 'teamlead');
    const interns = members.filter(m => m.role === 'intern');

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'founder': return <Crown className="h-4 w-4 text-yellow-500" />;
            case 'teamlead': return <Shield className="h-4 w-4 text-blue-500" />;
            default: return <UserIcon className="h-4 w-4 text-slate-500" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'founder': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'teamlead': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
            'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
            'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
            'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

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
                <h2 className="text-3xl font-bold tracking-tight">Team Directory</h2>
                <p className="text-muted-foreground">View all team members and their roles.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{members.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Founders</CardTitle>
                        <Crown className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{founders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Leads</CardTitle>
                        <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamleads.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interns</CardTitle>
                        <UserIcon className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interns.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Find Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="founder">Founders</SelectItem>
                                <SelectItem value="teamlead">Team Leads</SelectItem>
                                <SelectItem value="intern">Interns</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Team Grid */}
            {filteredMembers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No team members found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all'
                                ? 'Try adjusting your filters.'
                                : 'No team members have been added yet.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map(member => (
                        <Card key={member._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className={`h-14 w-14 ${getAvatarColor(member.name)}`}>
                                        <AvatarFallback className="text-white font-semibold">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold truncate">{member.name}</h3>
                                            {getRoleIcon(member.role)}
                                        </div>
                                        <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                                            {member.role === 'teamlead' ? 'Team Lead' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <a href={`mailto:${member.email}`} className="hover:text-foreground truncate">
                                            {member.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{member.department}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
