'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Search, Plus, FileText, Upload, Download,
    Folder, Star, Clock, Grid, List, ExternalLink,
    ArrowLeft, Check, X, Loader2, BookOpen, Trash2
} from 'lucide-react';
import { useSession } from '@/components/auth/SessionProvider';

interface Research {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    content?: string;
    projectId?: { _id: string; name: string };
    submittedBy: { _id: string; name: string; email: string; role: string };
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: { name: string };
    reviewNotes?: string;
    tags: string[];
    createdAt: string;
}

interface Project {
    _id: string;
    name: string;
}

export default function ResearchPage() {
    const { user: currentUser } = useSession();
    const [research, setResearch] = useState<Research[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'pdf',
        content: '',
        projectId: '',
        tags: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [researchRes, projectsRes] = await Promise.all([
                fetch('/api/research/list'),
                fetch('/api/projects/list'),
            ]);
            const researchData = await researchRes.json();
            const projectsData = await projectsRes.json();

            if (researchData.research) setResearch(researchData.research);
            if (projectsData.projects) setProjects(projectsData.projects);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            const res = await fetch('/api/research/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags,
                    projectId: formData.projectId || undefined,
                }),
            });
            if (res.ok) {
                setIsUploadOpen(false);
                setFormData({
                    title: '',
                    description: '',
                    fileUrl: '',
                    fileType: 'pdf',
                    content: '',
                    projectId: '',
                    tags: '',
                });
                fetchData();
            }
        } catch (err) {
            console.error('Failed to upload research', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this research?')) return;
        try {
            const res = await fetch(`/api/research/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setResearch(research.filter(r => r._id !== id));
            }
        } catch (err) {
            console.error('Failed to delete research', err);
        }
    };

    const handleReview = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
        try {
            const res = await fetch(`/api/research/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reviewNotes: notes }),
            });
            if (res.ok) {
                fetchData();
                setSelectedResearch(null);
            }
        } catch (err) {
            console.error('Failed to review research', err);
        }
    };

    const filteredResearch = research.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Document View Mode
    if (selectedResearch) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setSelectedResearch(null)} className="text-black hover:text-black">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Research
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{selectedResearch.title}</CardTitle>
                                <p className="text-muted-foreground mt-1">{selectedResearch.description}</p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(selectedResearch.status)}>
                                {selectedResearch.status}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                            <span>By: {selectedResearch.submittedBy.name}</span>
                            <span>•</span>
                            <span>{new Date(selectedResearch.createdAt).toLocaleDateString()}</span>
                            {selectedResearch.projectId && (
                                <>
                                    <span>•</span>
                                    <span>Project: {selectedResearch.projectId.name}</span>
                                </>
                            )}
                        </div>
                        {selectedResearch.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedResearch.tags.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Document Preview / Content */}
                        <div className="border rounded-lg p-6 min-h-[400px] bg-slate-50 dark:bg-slate-900">
                            {selectedResearch.content ? (
                                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {selectedResearch.content}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4">Document content not extracted</p>
                                    <Button variant="outline" asChild className="text-black hover:text-black">
                                        <a href={selectedResearch.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open Original File
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Review Section */}
                        {selectedResearch.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => handleReview(selectedResearch._id, 'approved')}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleReview(selectedResearch._id, 'rejected')}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        )}

                        {selectedResearch.reviewedBy && (
                            <div className="pt-4 border-t text-sm text-muted-foreground">
                                <p>Reviewed by: {selectedResearch.reviewedBy.name}</p>
                                {selectedResearch.reviewNotes && (
                                    <p className="mt-1">Notes: {selectedResearch.reviewNotes}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-blue-500" />
                        Research Vault
                    </h2>
                    <p className="text-muted-foreground">Upload and manage research papers and documents.</p>
                </div>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-black hover:text-black">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Research
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Upload Research</DialogTitle>
                            <DialogDescription>
                                Add a new research document or paper to the vault.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Research paper title"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fileUrl">File URL</Label>
                                    <Input
                                        id="fileUrl"
                                        value={formData.fileUrl}
                                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="fileType">File Type</Label>
                                    <Select
                                        value={formData.fileType}
                                        onValueChange={(v) => setFormData({ ...formData, fileType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="doc">DOC/DOCX</SelectItem>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="link">External Link</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Content (Optional)</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Paste document content for inline viewing..."
                                    rows={4}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="project">Project (Optional)</Label>
                                <Select
                                    value={formData.projectId}
                                    onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="market, analysis, Q4 (comma separated)"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="text-black hover:text-black">Cancel</Button>
                            <Button onClick={handleUpload} disabled={uploading || !formData.title || !formData.fileUrl} className="text-black hover:text-black">
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search research..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Research Grid/List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredResearch.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No research found</h3>
                    <p className="text-muted-foreground">Upload a research paper to get started.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResearch.map((item) => (
                        <Card
                            key={item._id}
                            className="hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => setSelectedResearch(item)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <Badge variant="outline" className={getStatusColor(item.status)}>
                                        {item.status}
                                    </Badge>
                                    <div className="flex gap-1">
                                        {currentUser?.role === 'founder' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
                                                onClick={(e) => handleDelete(e, item._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                            {item.fileType.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                                <CardTitle className="text-base mt-2 group-hover:text-blue-600 transition-colors">
                                    {item.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{item.submittedBy.name}</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredResearch.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedResearch(item)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.submittedBy.name} • {new Date(item.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={getStatusColor(item.status)}>
                                            {item.status}
                                        </Badge>
                                        {currentUser?.role === 'founder' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
                                                onClick={(e) => handleDelete(e, item._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-black hover:text-black">View</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
