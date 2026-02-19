import { useState } from 'react';
import { mockTasks, mockUsers, mockProjects } from '@/data/mockData';
import { Task, TaskStatus, TaskPriority } from '@/data/types';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Clock, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'overdue', label: 'Overdue' },
];

const priorityOptions: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const assignee = mockUsers.find(u => u.id === task.assignedTo);
  const assignedBy = mockUsers.find(u => u.id === task.assignedBy);
  const project = mockProjects.find(p => p.id === task.project);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">#{task.id.toUpperCase()}</span>
        <div className="flex gap-2">
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name || task.project}</span></div>
        <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{task.client}</span></div>
        <div><span className="text-muted-foreground">Assigned to:</span> <span className="font-medium">{assignee?.name}</span></div>
        <div><span className="text-muted-foreground">Assigned by:</span> <span className="font-medium">{assignedBy?.name}</span></div>
        <div><span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{task.deadline}</span></div>
        <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{task.timeLogged}h / {task.timeExpected}h</span></div>
      </div>

      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</span>
        <p className="text-sm mt-1 text-foreground">{task.description}</p>
      </div>

      {task.feedback && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
          <span className="text-xs font-semibold text-warning">Feedback</span>
          <p className="text-sm mt-1">{task.feedback}</p>
        </div>
      )}

      {task.attachments.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attachments</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {task.attachments.map(a => (
              <span key={a} className="text-xs bg-muted px-2 py-1 rounded border">{a}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {task.tags.map(tag => (
          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">#{tag}</span>
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { currentRole } = useRole();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = mockTasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const canCreate = currentRole === 'founder' || currentRole === 'teamlead';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Engine</h1>
          <p className="text-muted-foreground text-sm">{mockTasks.length} total tasks across all projects</p>
        </div>
        {canCreate && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Task Title</Label><Input className="mt-1" placeholder="e.g. Design landing page for XYZ" /></div>
                <div><Label>Description</Label><Textarea className="mt-1" placeholder="Task details and requirements..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Priority</Label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['urgent', 'high', 'medium', 'low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Deadline</Label><Input type="date" className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Assign To</Label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Intern" /></SelectTrigger>
                      <SelectContent>
                        {mockUsers.filter(u => u.role === 'intern').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Project</Label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Project" /></SelectTrigger>
                      <SelectContent>
                        {mockProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Expected Hours</Label><Input type="number" className="mt-1" placeholder="8" /></div>
                <Button className="w-full" onClick={() => setShowCreate(false)}>Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Task Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_90px_90px_80px_36px] gap-3 px-4 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Task</span>
          <span>Assignee</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Deadline</span>
          <span></span>
        </div>
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No tasks match your filters</div>
          ) : filtered.map(task => {
            const assignee = mockUsers.find(u => u.id === task.assignedTo);
            return (
              <div key={task.id} className="grid grid-cols-[1fr_120px_90px_90px_80px_36px] gap-3 px-4 py-4 items-center hover:bg-muted/20 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {task.timeLogged}h/{task.timeExpected}h · {task.client}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{assignee?.avatar}</div>
                  <span className="text-xs truncate">{assignee?.name.split(' ')[0]}</span>
                </div>
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <span className="text-xs text-muted-foreground">{task.deadline}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedTask(task)}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle className="text-base">{task.title}</DialogTitle></DialogHeader>
                    <TaskDetailModal task={task} onClose={() => setSelectedTask(null)} />
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
