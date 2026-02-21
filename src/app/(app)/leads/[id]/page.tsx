'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Calendar, User as UserIcon, Mail, Phone,
    Building2, DollarSign, Loader2, AlertTriangle, Clock
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
    _id: string;
    name: string;
    company: string;
    email: string;
    phone?: string;
    status: string;
    dealValue: number;
    dateAdded: string;
    assignedTo?: {
        name: string;
        email: string;
    };
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const res = await fetch(`/api/leads/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to fetch lead');
                setLead(data.lead);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLead();
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'contacted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'qualified': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'proposal': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'won': return 'bg-green-100 text-green-700 border-green-200';
            case 'lost': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900">Error Loading Lead</h3>
                <p className="text-red-700 mb-6">{error || 'Lead not found'}</p>
                <Button variant="outline" onClick={() => router.push('/leads')} className="text-black hover:text-black">
                    Back to Leads
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/leads"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-black">{lead.name}</h2>
                    <p className="text-slate-600">{lead.company}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                                <div className="flex items-center gap-2 text-black font-medium">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {lead.email}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</span>
                                <div className="flex items-center gap-2 text-black font-medium">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    {lead.phone || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</span>
                                <div className="flex items-center gap-2 text-black font-medium">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    {lead.company}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Added</span>
                                <div className="flex items-center gap-2 text-black font-medium">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {new Date(lead.dateAdded).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-black">Pipeline Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Status</span>
                            <Badge variant="outline" className={getStatusColor(lead.status)}>
                                {lead.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Deal Value</span>
                            <div className="flex items-center gap-1 text-lg font-bold text-black">
                                <DollarSign className="h-5 w-5 text-green-500" />
                                {lead.dealValue.toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <span className="text-sm font-semibold text-slate-700">Assigned To</span>
                            <div className="flex items-center gap-1 text-sm text-black">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                                {lead.assignedTo?.name || 'Unassigned'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
