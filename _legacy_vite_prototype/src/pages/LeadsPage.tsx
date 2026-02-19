import { useState } from 'react';
import { mockLeads, mockUsers } from '@/data/mockData';
import { Lead, LeadStatus } from '@/data/types';
import { LeadStatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Phone, Mail, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PIPELINE_STAGES: LeadStatus[] = ['new', 'contacted', 'converted', 'lost'];
const STAGE_LABELS: Record<LeadStatus, string> = { new: 'New Leads', contacted: 'Contacted', converted: 'Converted', lost: 'Lost' };
const STAGE_COLORS: Record<LeadStatus, string> = {
  new: 'border-t-info',
  contacted: 'border-t-warning',
  converted: 'border-t-success',
  lost: 'border-t-danger',
};

function LeadCard({ lead }: { lead: Lead }) {
  const assignee = mockUsers.find(u => u.id === lead.assignedTo);
  return (
    <div className="bg-card border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold leading-tight">{lead.name}</p>
          <p className="text-xs text-muted-foreground">{lead.company}</p>
        </div>
        <span className="text-xs font-bold text-success flex-shrink-0">₹{(lead.dealValue/1000).toFixed(0)}K</span>
      </div>
      <div className="text-xs space-y-1 text-muted-foreground">
        <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</div>
        <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t">
        <span className="text-xs text-muted-foreground">Follow-up: {lead.followUpDate}</span>
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize">{lead.source.replace('_',' ')}</span>
      </div>
      {assignee && (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{assignee.avatar}</div>
          <span className="text-xs text-muted-foreground">{assignee.name}</span>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const filtered = mockLeads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  const totalPipeline = mockLeads.filter(l => l.status !== 'lost').reduce((s, l) => s + l.dealValue, 0);
  const converted = mockLeads.filter(l => l.status === 'converted').reduce((s, l) => s + l.dealValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads & CRM</h1>
          <p className="text-muted-foreground text-sm">{mockLeads.length} leads · Pipeline: ₹{(totalPipeline/100000).toFixed(1)}L · Converted: ₹{(converted/100000).toFixed(1)}L</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Lead Name</Label><Input className="mt-1" placeholder="Full name" /></div>
                  <div><Label>Company</Label><Input className="mt-1" placeholder="Company name" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input className="mt-1" placeholder="+91 98765 43210" /></div>
                  <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="email@company.com" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Source</Label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Source" /></SelectTrigger>
                      <SelectContent>
                        {['instagram','referral','website','linkedin','cold_outreach','other'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Deal Value (₹)</Label><Input className="mt-1" type="number" placeholder="100000" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Assign To</Label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Team member" /></SelectTrigger>
                      <SelectContent>
                        {mockUsers.filter(u => u.role !== 'intern').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Follow-up Date</Label><Input type="date" className="mt-1" /></div>
                </div>
                <div><Label>Notes</Label><Textarea className="mt-1" placeholder="Lead notes..." /></div>
                <Button className="w-full" onClick={() => setShowCreate(false)}>Add Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 gap-3">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = mockLeads.filter(l => l.status === stage);
          const value = stageLeads.reduce((s, l) => s + l.dealValue, 0);
          return (
            <div key={stage} className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stageLeads.length}</div>
              <div className="text-sm text-muted-foreground">{STAGE_LABELS[stage]}</div>
              <div className="text-xs font-semibold text-primary mt-1">₹{(value/1000).toFixed(0)}K</div>
            </div>
          );
        })}
      </div>

      {/* Search & View Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('kanban')}>Kanban</Button>
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('table')}>Table</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className={`bg-muted/30 rounded-xl border-t-4 ${STAGE_COLORS[stage]} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
                <span className="text-xs bg-background border rounded-full px-2 py-0.5 font-medium">
                  {filtered.filter(l => l.status === stage).length}
                </span>
              </div>
              <div className="space-y-2">
                {filtered.filter(l => l.status === stage).map(lead => <LeadCard key={lead.id} lead={lead} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_130px_90px_90px_100px] gap-3 px-4 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Lead</span><span>Assigned To</span><span>Deal Value</span><span>Status</span><span>Follow-up</span>
          </div>
          <div className="divide-y">
            {filtered.map(lead => {
              const assignee = mockUsers.find(u => u.id === lead.assignedTo);
              return (
                <div key={lead.id} className="grid grid-cols-[1fr_130px_90px_90px_100px] gap-3 px-4 py-3 items-center hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company} · {lead.source.replace('_',' ')}</p>
                  </div>
                  <span className="text-xs">{assignee?.name}</span>
                  <span className="text-sm font-semibold text-success">₹{(lead.dealValue/1000).toFixed(0)}K</span>
                  <LeadStatusBadge status={lead.status} />
                  <span className="text-xs text-muted-foreground">{lead.followUpDate}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
