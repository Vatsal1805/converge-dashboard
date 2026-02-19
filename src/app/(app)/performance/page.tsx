'use client';

import { useState, useEffect } from 'react';
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
import { 
    TrendingUp, Plus, Star, Award, Target, Users, 
    Loader2, ChevronRight, BarChart3
} from 'lucide-react';

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

export default function PerformancePage() {
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);

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
            const [reviewsRes, internsRes] = await Promise.all([
                fetch('/api/performance/list'),
                fetch('/api/users/list?role=intern'),
            ]);
            const reviewsData = await reviewsRes.json();
            const internsData = await internsRes.json();
            
            if (reviewsData.performances) setReviews(reviewsData.performances);
            if (internsData.users) setInterns(internsData.users);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
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
            } else {
                const error = await res.json();
                console.error('Create review error:', error);
            }
        } catch (err) {
            console.error('Failed to create review', err);
        } finally {
            setCreating(false);
        }
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

    // Stats cards
    const avgPerformance = interns.length > 0 
        ? Math.round(interns.reduce((sum, i) => sum + (i.performanceScore || 0), 0) / interns.length)
        : 0;
    const topPerformer = interns.reduce((top, i) => (i.performanceScore || 0) > (top?.performanceScore || 0) ? i : top, interns[0]);
    const reviewsThisMonth = reviews.filter(r => r.period === new Date().toISOString().slice(0, 7)).length;

    // Intern Detail View
    if (selectedIntern) {
        const internReviews = reviews.filter(r => r.intern._id === selectedIntern._id);
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setSelectedIntern(null)}>
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
                                <CardDescription>Reviewed by {review.reviewer.name}</CardDescription>
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
        );
    }

    return (
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Review
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>Create Performance Review</DialogTitle>
                            <DialogDescription>
                                Evaluate an intern's performance for a specific period.
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
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateReview} disabled={creating || !formData.intern}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Review
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(avgPerformance)}`}>{avgPerformance}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{topPerformer?.name || 'N/A'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reviews This Month</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reviewsThisMonth}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Interns Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Intern Performance</CardTitle>
                    <CardDescription>Click on an intern to view their detailed performance history.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
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
                                                <Button variant="ghost" size="sm">
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
        </div>
    );
}
