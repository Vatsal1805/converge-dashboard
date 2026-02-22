'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp, Plus, Star, Award, Target, Users,
    Loader2, ChevronRight, BarChart3, Trophy, Edit, Trash2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceReview {
    _id: string;
    intern: { _id: string; name: string; email: string; department: string };
    reviewer: { _id: string; name: string; email: string; role: string };
    period: string;
    metrics: {
        taskCompletion: number;
        quality: number;
        communication: number;
        punctuality: number;
        initiative: number;
    };
    overallScore: number;
    feedback: string;
    goals: string;
    createdAt: string;
}

interface Intern {
    _id: string;
    name: string;
    email: string;
    department: string;
    performanceScore: number;
}

interface Ranking {
    id: string;
    name: string;
    department: string;
    avgPerformance: number;
    completionRate: number;
    punctualityRate: number;
    totalTasks: number;
    weightedScore: number;
}

export default function PerformancePage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRankings, setLoadingRankings] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
    const [rankingPeriod, setRankingPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
    const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
    const [updating, setUpdating] = useState(false);

    const [formData, setFormData] = useState({
        intern: '',
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        metrics: {
            taskCompletion: 5,
            quality: 5,
            communication: 5,
            punctuality: 5,
            initiative: 5,
        },
        feedback: '',
        goals: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reviewsRes, internsRes, userRes] = await Promise.all([
                fetch('/api/performance/list'),
                fetch('/api/users/list?role=intern'),
                fetch('/api/auth/me'),
            ]);
            const reviewsData = await reviewsRes.json();
            const internsData = await internsRes.json();
            const userData = await userRes.json();

            setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData.performances || []));
            setInterns(Array.isArray(internsData) ? internsData : (internsData.users || []));
            if (userData.user) {
                setCurrentUser(userData.user);
                if (userData.user.role === 'intern') {
                    router.push('/dashboard/intern');
                }
            }
            // Fetch rankings after current user is set to ensure role is available if needed
            fetchRankings(rankingPeriod);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRankings = async (period: string) => {
        setLoadingRankings(true);
        try {
            const res = await fetch(`/api/performance/ranking?period=${period}`);
            const data = await res.json();
            if (data.rankings) {
                setRankings(data.rankings);
            }
        } catch (err) {
            console.error('Failed to fetch rankings', err);
        } finally {
            setLoadingRankings(false);
        }
    };

    const handleCreateReview = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/performance/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsDialogOpen(false);
                setFormData({
                    intern: '',
                    period: new Date().toISOString().slice(0, 7),
                    metrics: {
                        taskCompletion: 5,
                        quality: 5,
                        communication: 5,
                        punctuality: 5,
                        initiative: 5,
                    },
                    feedback: '',
                    goals: '',
                });
                fetchData();
            }
        } catch (err) {
            console.error('Failed to create review', err);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateReview = async () => {
        if (!editingReview) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/performance/${editingReview._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setEditingReview(null);
                setIsDialogOpen(false);
                setFormData({
                    intern: '',
                    period: new Date().toISOString().slice(0, 7),
                    metrics: {
                        taskCompletion: 5,
                        quality: 5,
                        communication: 5,
                        punctuality: 5,
                        initiative: 5,
                    },
                    feedback: '',
                    goals: '',
                });
                fetchData();
            }
        } catch (err) {
            console.error('Failed to update review', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm('Are you sure you want to delete this performance review?')) return;
        try {
            const res = await fetch(`/api/performance/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Failed to delete review', err);
        }
    };

    const openEditDialog = (review: PerformanceReview) => {
        setEditingReview(review);
        setFormData({
            intern: review.intern._id,
            period: review.period,
            metrics: { ...review.metrics },
            feedback: review.feedback || '',
            goals: review.goals || '',
        });
        setIsDialogOpen(true);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700';
        if (score >= 60) return 'bg-blue-100 text-blue-700';
        if (score >= 40) return 'bg-amber-100 text-amber-700';
        return 'bg-red-100 text-red-700';
    };

    const calculateAvgScore = () => {
        const m = formData.metrics;
        return Math.round(((m.taskCompletion + m.quality + m.communication + m.punctuality + m.initiative) / 5) * 10);
    };

    // Performance Optimization: Memoize stats calculations
    const { avgPerformance, topPerformer, reviewsThisMonth } = useMemo(() => {
        const avg = interns.length > 0
            ? Math.round(interns.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / interns.length)
            : 0;
        const top = interns.reduce((top, i) => (i.performanceScore || 0) > (top?.performanceScore || 0) ? i : top, interns[0]);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const count = reviews.filter(r => r.period === currentMonth).length;

        return { avgPerformance: avg, topPerformer: top, reviewsThisMonth: count };
    }, [interns, reviews]);

    // Intern Detail View - Refactored to be part of main render tree
    const internReviews = useMemo(() => {
        if (!selectedIntern) return [];
        return reviews.filter(r => r.intern._id === selectedIntern._id);
    }, [selectedIntern, reviews]);

    return (
        <div className="space-y-6">
            {/* Dialog - Always rendered in the DOM to avoid unmounting issues */}
            {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>{editingReview ? 'Edit Performance Review' : 'Create Performance Review'}</DialogTitle>
                            <DialogDescription>
                                {editingReview ? 'Modify the existing evaluation.' : 'Evaluate an intern\'s performance for a specific period.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Intern</Label>
                                    <Select
                                        value={formData.intern}
                                        onValueChange={(v) => setFormData({ ...formData, intern: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select intern" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {interns.map((i) => (
                                                <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Period</Label>
                                    <input
                                        type="month"
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-medium">Metrics (1-10)</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <Label>Task Completion</Label>
                                        <span className="text-muted-foreground">{formData.metrics.taskCompletion}</span>
                                    </div>
                                    <Slider
                                        value={[formData.metrics.taskCompletion]}
                                        onValueChange={([v]: number[]) => setFormData({
                                            ...formData,
                                            metrics: { ...formData.metrics, taskCompletion: v }
                                        })}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <Label>Quality of Work</Label>
                                        <span className="text-muted-foreground">{formData.metrics.quality}</span>
                                    </div>
                                    <Slider
                                        value={[formData.metrics.quality]}
                                        onValueChange={([v]: number[]) => setFormData({
                                            ...formData,
                                            metrics: { ...formData.metrics, quality: v }
                                        })}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <Label>Communication</Label>
                                        <span className="text-muted-foreground">{formData.metrics.communication}</span>
                                    </div>
                                    <Slider
                                        value={[formData.metrics.communication]}
                                        onValueChange={([v]: number[]) => setFormData({
                                            ...formData,
                                            metrics: { ...formData.metrics, communication: v }
                                        })}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <Label>Punctuality</Label>
                                        <span className="text-muted-foreground">{formData.metrics.punctuality}</span>
                                    </div>
                                    <Slider
                                        value={[formData.metrics.punctuality]}
                                        onValueChange={([v]: number[]) => setFormData({
                                            ...formData,
                                            metrics: { ...formData.metrics, punctuality: v }
                                        })}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <Label>Initiative</Label>
                                        <span className="text-muted-foreground">{formData.metrics.initiative}</span>
                                    </div>
                                    <Slider
                                        value={[formData.metrics.initiative]}
                                        onValueChange={([v]: number[]) => setFormData({
                                            ...formData,
                                            metrics: { ...formData.metrics, initiative: v }
                                        })}
                                        min={1}
                                        max={10}
                                        step={1}
                                    />
                                </div>

                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                    <span className="text-sm text-muted-foreground">Calculated Score: </span>
                                    <span className={`text-lg font-bold ${getScoreColor(calculateAvgScore())}`}>
                                        {calculateAvgScore()}%
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Feedback</Label>
                                <Textarea
                                    value={formData.feedback}
                                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                                    placeholder="Provide constructive feedback..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Goals for Next Period</Label>
                                <Textarea
                                    value={formData.goals}
                                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                    placeholder="Set goals and expectations..."
                                    rows={2}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsDialogOpen(false);
                                setEditingReview(null);
                            }} className="text-black hover:text-black">Cancel</Button>
                            <Button onClick={editingReview ? handleUpdateReview : handleCreateReview} disabled={creating || updating || !formData.intern} className="text-black hover:text-black">
                                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingReview ? 'Save Changes' : 'Submit Review'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {selectedIntern ? (
                /* Intern Detail View */
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setSelectedIntern(null)} className="text-black hover:text-black">
                            ← Back to Performance
                        </Button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{selectedIntern.name}</h2>
                            <p className="text-muted-foreground">{selectedIntern.email} • {selectedIntern.department}</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-4xl font-bold ${getScoreColor(selectedIntern.performanceScore || 0)}`}>
                                {selectedIntern.performanceScore || 0}%
                            </div>
                            <p className="text-sm text-muted-foreground">Overall Score</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {internReviews.map((review) => (
                            <Card key={review._id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{review.period}</CardTitle>
                                        <Badge className={getScoreBgColor(review.overallScore)}>
                                            {review.overallScore}%
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <CardDescription>Reviewed by {review.reviewer.name}</CardDescription>
                                        {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-indigo-600" onClick={() => openEditDialog(review)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {currentUser?.role === 'founder' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:text-red-600" onClick={() => handleDeleteReview(review._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Task Completion</span>
                                            <span>{review.metrics.taskCompletion}/10</span>
                                        </div>
                                        <Progress value={review.metrics.taskCompletion * 10} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Quality</span>
                                            <span>{review.metrics.quality}/10</span>
                                        </div>
                                        <Progress value={review.metrics.quality * 10} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Communication</span>
                                            <span>{review.metrics.communication}/10</span>
                                        </div>
                                        <Progress value={review.metrics.communication * 10} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Punctuality</span>
                                            <span>{review.metrics.punctuality}/10</span>
                                        </div>
                                        <Progress value={review.metrics.punctuality * 10} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Initiative</span>
                                            <span>{review.metrics.initiative}/10</span>
                                        </div>
                                        <Progress value={review.metrics.initiative * 10} className="h-2" />
                                    </div>
                                    {review.feedback && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm font-medium">Feedback</p>
                                            <p className="text-sm text-muted-foreground mt-1">{review.feedback}</p>
                                        </div>
                                    )}
                                    {review.goals && (
                                        <div>
                                            <p className="text-sm font-medium">Goals</p>
                                            <p className="text-sm text-muted-foreground mt-1">{review.goals}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {internReviews.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No performance reviews yet for this intern.
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                /* Main View */
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                                <BarChart3 className="h-7 w-7 text-indigo-500" />
                                Performance Reviews
                            </h2>
                            <p className="text-muted-foreground">Track and evaluate intern performance.</p>
                        </div>
                        {(currentUser?.role === 'founder' || currentUser?.role === 'teamlead') && (
                            <Button onClick={() => {
                                setEditingReview(null);
                                setFormData({
                                    intern: '',
                                    period: new Date().toISOString().slice(0, 7),
                                    metrics: {
                                        taskCompletion: 5,
                                        quality: 5,
                                        communication: 5,
                                        punctuality: 5,
                                        initiative: 5,
                                    },
                                    feedback: '',
                                    goals: '',
                                });
                                setIsDialogOpen(true);
                            }} className="text-black hover:text-black">
                                <Plus className="mr-2 h-4 w-4" />
                                New Review
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="interns" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="interns">Intern List</TabsTrigger>
                            <TabsTrigger value="rankings">Performance Rankings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="interns">
                            {/* Interns Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Intern Performance</CardTitle>
                                    <CardDescription>Click on an intern to view their detailed performance history.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Performance Score</TableHead>
                                                    <TableHead>Reviews</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {[...Array(5)].map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                                        <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : interns.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No interns found.
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Performance Score</TableHead>
                                                    <TableHead>Reviews</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {interns.map((intern) => {
                                                    const internReviewCount = reviews.filter(r => r.intern._id === intern._id).length;
                                                    return (
                                                        <TableRow
                                                            key={intern._id}
                                                            className="cursor-pointer"
                                                            onClick={() => setSelectedIntern(intern)}
                                                        >
                                                            <TableCell className="font-medium">{intern.name}</TableCell>
                                                            <TableCell>{intern.department}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Progress
                                                                        value={intern.performanceScore || 0}
                                                                        className="w-20 h-2"
                                                                    />
                                                                    <Badge className={getScoreBgColor(intern.performanceScore || 0)}>
                                                                        {intern.performanceScore || 0}%
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{internReviewCount}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="sm" className="text-black hover:text-black">
                                                                    View <ChevronRight className="h-4 w-4 ml-1" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="rankings">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Leaderboard</CardTitle>
                                        <CardDescription>Intern rankings based on weighted performance and task completion.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs uppercase text-slate-500 font-bold">Month:</Label>
                                        <input
                                            type="month"
                                            value={rankingPeriod}
                                            onChange={(e) => {
                                                setRankingPeriod(e.target.value);
                                                fetchRankings(e.target.value);
                                            }}
                                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loadingRankings ? (
                                        <div className="space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Skeleton key={i} className="h-16 w-full" />
                                            ))}
                                        </div>
                                    ) : rankings.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 italic">
                                            No ranking data available for this period.
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16 text-center">Rank</TableHead>
                                                    <TableHead>Intern</TableHead>
                                                    <TableHead className="text-center">Performance</TableHead>
                                                    <TableHead className="text-center">Completion</TableHead>
                                                    <TableHead className="text-center">Punctuality</TableHead>
                                                    <TableHead className="text-right">Weighted Score</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rankings.map((rank, index) => (
                                                    <TableRow key={rank.id}>
                                                        <TableCell className="text-center font-bold">
                                                            {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />}
                                                            {index === 1 && <Trophy className="h-5 w-5 text-slate-400 mx-auto" />}
                                                            {index === 2 && <Trophy className="h-5 w-5 text-amber-600 mx-auto" />}
                                                            {index > 2 && index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-semibold text-black">{rank.name}</div>
                                                                <div className="text-xs text-slate-500">{rank.department}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={getScoreBgColor(rank.avgPerformance)}>
                                                                {rank.avgPerformance.toFixed(1)}%
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs font-medium text-black">{rank.completionRate}%</span>
                                                                <Progress value={rank.completionRate} className="h-1 w-12" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-sm text-black">{rank.punctualityRate}%</span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-lg font-bold text-indigo-600">{rank.weightedScore}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
