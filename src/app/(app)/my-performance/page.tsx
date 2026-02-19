'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp, TrendingDown, Minus, Star, Target, MessageSquare, Calendar
} from 'lucide-react';

interface Performance {
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

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function MyPerformancePage() {
    const [performances, setPerformances] = useState<Performance[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user) {
                setCurrentUser(data.user);
                fetchPerformances(data.user.id);
            }
        } catch (err) {
            console.error('Failed to fetch user', err);
            setLoading(false);
        }
    };

    const fetchPerformances = async (userId: string) => {
        try {
            const res = await fetch(`/api/performance/list?internId=${userId}`);
            const data = await res.json();
            if (data.performances) {
                setPerformances(data.performances);
            }
        } catch (err) {
            console.error('Failed to fetch performances', err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
        if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
        if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Needs Improvement</Badge>;
        return <Badge variant="destructive">Poor</Badge>;
    };

    const getTrend = (current: number, previous: number | undefined) => {
        if (previous === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
        if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate averages
    const latestPerformance = performances[0];
    const previousPerformance = performances[1];

    const averageScore = performances.length > 0
        ? Math.round(performances.reduce((acc, p) => acc + p.overallScore, 0) / performances.length)
        : 0;

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
                <h2 className="text-3xl font-bold tracking-tight">My Performance</h2>
                <p className="text-muted-foreground">View your performance reviews and feedback.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${latestPerformance ? getScoreColor(latestPerformance.overallScore) : ''}`}>
                                {latestPerformance ? latestPerformance.overallScore : '--'}
                            </span>
                            <span className="text-muted-foreground">/100</span>
                            {latestPerformance && getTrend(latestPerformance.overallScore, previousPerformance?.overallScore)}
                        </div>
                        {latestPerformance && getScoreBadge(latestPerformance.overallScore)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                                {averageScore || '--'}
                            </span>
                            <span className="text-muted-foreground">/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Based on {performances.length} review{performances.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{performances.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {latestPerformance ? `Latest: ${formatPeriod(latestPerformance.period)}` : 'No reviews yet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Latest Performance Breakdown */}
            {latestPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Performance Breakdown</CardTitle>
                        <CardDescription>
                            Review for {formatPeriod(latestPerformance.period)} by {latestPerformance.reviewer.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-5">
                            {[
                                { label: 'Task Completion', value: latestPerformance.metrics.taskCompletion },
                                { label: 'Quality', value: latestPerformance.metrics.quality },
                                { label: 'Communication', value: latestPerformance.metrics.communication },
                                { label: 'Punctuality', value: latestPerformance.metrics.punctuality },
                                { label: 'Initiative', value: latestPerformance.metrics.initiative },
                            ].map((metric) => (
                                <div key={metric.label} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{metric.label}</span>
                                        <span className="text-sm font-bold">{metric.value}/10</span>
                                    </div>
                                    <Progress value={metric.value * 10} className="h-2" />
                                </div>
                            ))}
                        </div>

                        {latestPerformance.feedback && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Feedback</h4>
                                <p className="text-muted-foreground">{latestPerformance.feedback}</p>
                            </div>
                        )}

                        {latestPerformance.goals && (
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Goals for Next Period</h4>
                                <p className="text-muted-foreground">{latestPerformance.goals}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Performance History */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance History</CardTitle>
                    <CardDescription>All your performance reviews</CardDescription>
                </CardHeader>
                <CardContent>
                    {performances.length === 0 ? (
                        <div className="text-center py-12">
                            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                            <p className="text-muted-foreground">
                                You haven&apos;t received any performance reviews yet. Keep up the good work!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {performances.map((perf, index) => (
                                <div
                                    key={perf._id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`text-2xl font-bold ${getScoreColor(perf.overallScore)}`}>
                                            {perf.overallScore}
                                        </div>
                                        <div>
                                            <div className="font-medium">{formatPeriod(perf.period)}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Reviewed by {perf.reviewer.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getScoreBadge(perf.overallScore)}
                                        {index < performances.length - 1 && getTrend(perf.overallScore, performances[index + 1].overallScore)}
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(perf.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
