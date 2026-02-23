'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Target, Plus, Search, Phone, Mail, Building2,
    DollarSign, Loader2, MoreHorizontal, ArrowUpRight, Trash2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Lead {
    _id: string;
    name: string;
    company: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    dealValue: number;
    dateAdded: string;
}

const statusConfig = {
    new: { label: 'New', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    proposal: { label: 'Proposal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    won: { label: 'Won', color: 'bg-green-100 text-green-700 border-green-200' },
    lost: { label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function LeadsPage() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

    const [newLead, setNewLead] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        dealValue: 0,
        status: 'new',
    });

    const fetchData = async () => {
        try {
            const [leadsRes, userRes] = await Promise.all([
                fetch('/api/leads/list'),
                fetch('/api/auth/me')
            ]);
            const leadsData = await leadsRes.json();
            const userData = await userRes.json();

            const leadsList = Array.isArray(leadsData) ? leadsData : (leadsData.leads || []);
            setLeads(leadsList);
            if (userData.user) {
                setCurrentUser(userData.user);
                if (userData.user.role === 'intern') {
                    router.push('/dashboard/intern');
                }
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Validate phone number if provided
        if (newLead.phone && newLead.phone.trim() !== '') {
            const phoneDigits = newLead.phone.replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
                setError('Phone number must be exactly 10 digits');
                setSubmitting(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/leads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newLead,
                    dealValue: Number(newLead.dealValue)
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create lead');
            }

            // Reset form and close dialog
            setNewLead({ name: '', company: '', email: '', phone: '', dealValue: 0, status: 'new' });
            setError('');
            fetchData();
            setCreateOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setLeads(leads.map(l => l._id === leadId ? { ...l, status: newStatus as any } : l));
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pipeline metrics
    const pipelineValue = leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + l.dealValue, 0);
    const wonValue = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.dealValue, 0);
    const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status)).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-black">Leads & CRM</h2>
                    <p className="text-slate-600">Manage your sales pipeline and customer relationships.</p>
                </div>

                {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                    <Dialog open={createOpen} onOpenChange={(open) => {
                        setCreateOpen(open);
                        if (!open) {
                            setError('');
                            setNewLead({ name: '', company: '', email: '', phone: '', dealValue: 0, status: 'new' });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="text-black hover:text-black">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleCreateLead}>
                                <DialogHeader>
                                    <DialogTitle>Add New Lead</DialogTitle>
                                    <DialogDescription>
                                        Enter the lead details to add them to your pipeline.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Contact Name</Label>
                                            <Input
                                                id="name"
                                                value={newLead.name}
                                                onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company">Company</Label>
                                            <Input
                                                id="company"
                                                value={newLead.company}
                                                onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                                                placeholder="Acme Corp"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newLead.email}
                                                onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                                placeholder="john@acme.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone (10 digits)</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={newLead.phone}
                                                onChange={e => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    if (value.length <= 10) {
                                                        setNewLead({ ...newLead, phone: value });
                                                    }
                                                }}
                                                placeholder="1234567890"
                                                maxLength={10}
                                            />
                                            {newLead.phone && newLead.phone.length > 0 && newLead.phone.length !== 10 && (
                                                <p className="text-xs text-red-600">Must be exactly 10 digits</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dealValue">Deal Value ($)</Label>
                                            <Input
                                                id="dealValue"
                                                type="number"
                                                value={newLead.dealValue}
                                                onChange={e => setNewLead({ ...newLead, dealValue: Number(e.target.value) })}
                                                placeholder="10000"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={newLead.status} onValueChange={v => setNewLead({ ...newLead, status: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="contacted">Contacted</SelectItem>
                                                    <SelectItem value="qualified">Qualified</SelectItem>
                                                    <SelectItem value="proposal">Proposal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => setCreateOpen(false)}
                                        disabled={submitting}
                                        className="text-black hover:text-black"
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="text-black hover:text-black">
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Lead
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-black">${pipelineValue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">{activeLeads} active leads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-black">${wonValue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">{leads.filter(l => l.status === 'won').length} deals closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-black">{leads.length}</div>
                        <p className="text-xs text-slate-500">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search leads..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-black font-bold">Contact</TableHead>
                                <TableHead className="text-black font-bold">Company</TableHead>
                                <TableHead className="text-black font-bold">Deal Value</TableHead>
                                <TableHead className="text-black font-bold">Status</TableHead>
                                <TableHead className="text-right text-black font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No leads found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead._id} className="group">
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold text-black">{lead.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-700 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        {lead.email}
                                                    </span>
                                                    {lead.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-black">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                {lead.company}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-black">${lead.dealValue.toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell>
                                            {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') ? (
                                                <Select
                                                    defaultValue={lead.status}
                                                    onValueChange={(v) => handleStatusChange(lead._id, v)}
                                                >
                                                    <SelectTrigger className={`w-[120px] h-8 ${statusConfig[lead.status]?.color}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">New</SelectItem>
                                                        <SelectItem value="contacted">Contacted</SelectItem>
                                                        <SelectItem value="qualified">Qualified</SelectItem>
                                                        <SelectItem value="proposal">Proposal</SelectItem>
                                                        <SelectItem value="won">Won</SelectItem>
                                                        <SelectItem value="lost">Lost</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="outline" className={statusConfig[lead.status]?.color}>
                                                    {statusConfig[lead.status]?.label}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {currentUser?.role === 'founder' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this lead?')) {
                                                            try {
                                                                const res = await fetch(`/api/leads/${lead._id}`, { method: 'DELETE' });
                                                                if (res.ok) {
                                                                    setLeads(leads.filter(l => l._id !== lead._id));
                                                                }
                                                            } catch (err) {
                                                                console.error('Delete error:', err);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:text-black"
                                                onClick={() => router.push(`/leads/${lead._id}`)}
                                            >
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
