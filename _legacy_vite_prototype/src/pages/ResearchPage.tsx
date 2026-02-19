import { useState } from 'react';
import { mockResearch, mockUsers, mockProjects } from '@/data/mockData';
import { ResearchDoc, ResearchCategory } from '@/data/types';
import { ResearchStatusBadge } from '@/components/StatusBadge';
import { useRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORY_LABELS: Record<ResearchCategory, string> = {
  market_research: 'Market Research',
  competitor_analysis: 'Competitor Analysis',
  strategy: 'Strategy',
  industry_report: 'Industry Report',
  other: 'Other',
};

export default function ResearchPage() {
  const { currentRole, currentUser } = useRole();
  const [docs, setDocs] = useState<ResearchDoc[]>(mockResearch);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = docs.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleApprove = (docId: string) => {
    setDocs(docs.map(d => d.id === docId ? { ...d, status: 'approved', feedback: 'Approved. Good work!' } : d));
  };

  const handleReject = (docId: string) => {
    setDocs(docs.map(d => d.id === docId ? { ...d, status: 'rejected', feedback: 'Needs more depth. Please revise and resubmit.' } : d));
  };

  const canReview = currentRole === 'founder' || currentRole === 'teamlead';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Research Vault</h1>
          <p className="text-muted-foreground text-sm">{docs.length} documents · {docs.filter(d => d.status === 'approved').length} approved</p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Upload Research</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Upload Research Document</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input className="mt-1" placeholder="Document title..." /></div>
              <div><Label>Description</Label><Textarea className="mt-1" placeholder="Brief summary of the research..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Project</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Project" /></SelectTrigger>
                    <SelectContent>{mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Document File</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p>Drop your PDF/DOCX here or click to browse</p>
                  <p className="text-xs mt-1">Max 20MB</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowUpload(false)}>Submit for Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-warning">{docs.filter(d => d.status === 'pending_review').length}</div>
          <div className="text-sm text-muted-foreground">Pending Review</div>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-success">{docs.filter(d => d.status === 'approved').length}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{[...new Set(docs.map(d => d.category))].length}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filtered.map(doc => {
          const author = mockUsers.find(u => u.id === doc.authorId);
          const project = mockProjects.find(p => p.id === doc.projectId);

          return (
            <div key={doc.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-semibold">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {author?.name} · {project?.name} · {doc.fileName} ({doc.fileSize}) · {doc.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{CATEGORY_LABELS[doc.category]}</span>
                      <ResearchStatusBadge status={doc.status} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>
                  {doc.feedback && (
                    <div className={`mt-2 text-xs px-3 py-2 rounded-lg border ${doc.status === 'approved' ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
                      <strong>Feedback:</strong> {doc.feedback}
                    </div>
                  )}
                </div>
              </div>
              {canReview && doc.status === 'pending_review' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" variant="outline" className="gap-1.5 border-success/50 text-success hover:bg-success/10" onClick={() => handleApprove(doc.id)}>
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 border-danger/50 text-danger hover:bg-danger/10" onClick={() => handleReject(doc.id)}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              )}
              {(!canReview || doc.status !== 'pending_review') && (
                <div className="flex justify-end mt-3">
                  <Button size="sm" variant="ghost" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
