import { mockTasks, mockProjects, mockUsers, mockLeads, mockPerformance } from '@/data/mockData';
import { StatCard } from '@/components/StatCard';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Briefcase, Users, CheckSquare, AlertTriangle, TrendingUp, Target, Star } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { mockIdeas } from '@/data/mockData';

const COLORS = ['hsl(217,91%,60%)', 'hsl(38,92%,50%)', 'hsl(142,71%,45%)', 'hsl(0,84%,60%)'];

export default function FounderDashboard() {
  const activeTasks = mockTasks.filter(t => ['in_progress', 'accepted', 'pending'].includes(t.status)).length;
  const completedThisWeek = mockTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue').length;
  const activeProjects = mockProjects.filter(p => p.status === 'active').length;
  const interns = mockUsers.filter(u => u.role === 'intern').length;

  const taskStatusData = [
    { name: 'Pending', value: mockTasks.filter(t => t.status === 'pending').length },
    { name: 'In Progress', value: mockTasks.filter(t => t.status === 'in_progress').length },
    { name: 'Under Review', value: mockTasks.filter(t => t.status === 'under_review').length },
    { name: 'Completed', value: mockTasks.filter(t => t.status === 'completed').length },
  ];

  const leadPipeline = [
    { name: 'New', value: mockLeads.filter(l => l.status === 'new').length, fill: 'hsl(199,89%,48%)' },
    { name: 'Contacted', value: mockLeads.filter(l => l.status === 'contacted').length, fill: 'hsl(38,92%,50%)' },
    { name: 'Converted', value: mockLeads.filter(l => l.status === 'converted').length, fill: 'hsl(142,71%,45%)' },
    { name: 'Lost', value: mockLeads.filter(l => l.status === 'lost').length, fill: 'hsl(0,84%,60%)' },
  ];

  const topInterns = mockPerformance
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map(p => ({
      name: mockUsers.find(u => u.id === p.userId)?.name?.split(' ')[0] || 'Unknown',
      score: p.totalScore,
    }));

  const recentTasks = mockTasks.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Founder Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Company overview — Converge Digitals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Active Projects" value={activeProjects} subtitle="Currently running" icon={<Briefcase className="h-4 w-4 text-primary" />} iconBg="bg-primary/10" />
        <StatCard title="Total Interns" value={interns} subtitle="Across departments" icon={<Users className="h-4 w-4 text-info" />} iconBg="bg-info/10" />
        <StatCard title="Tasks Done (Week)" value={completedThisWeek} subtitle="This week" icon={<CheckSquare className="h-4 w-4 text-success" />} iconBg="bg-success/10" trend={{ value: '+3 vs last week', positive: true }} />
        <StatCard title="Overdue Tasks" value={overdueTasks} subtitle="Need attention" icon={<AlertTriangle className="h-4 w-4 text-danger" />} iconBg="bg-danger/10" />
        <StatCard title="Revenue (Month)" value="₹8.2L" subtitle="Feb 2025" icon={<TrendingUp className="h-4 w-4 text-warning" />} iconBg="bg-warning/10" trend={{ value: '+12% vs Jan', positive: true }} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Pipeline */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Lead Pipeline</h3>
          </div>
          <div className="space-y-3">
            {leadPipeline.map(item => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20">{item.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(item.value / mockLeads.length) * 100}%`, backgroundColor: item.fill }}
                  />
                </div>
                <span className="text-sm font-semibold w-4 text-right">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-success">{mockLeads.filter(l=>l.status==='converted').length}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">₹{(mockLeads.reduce((s,l)=>s+l.dealValue,0)/100000).toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">Pipeline Value</p>
            </div>
          </div>
        </div>

        {/* Top Interns */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">Top Performers</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topInterns} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={55} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Task Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {taskStatusData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-xs text-muted-foreground">{item.name}: <span className="font-semibold text-foreground">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-sm">Recent Tasks</h3>
          <span className="text-xs text-muted-foreground">{mockTasks.length} total</span>
        </div>
        <div className="divide-y">
          {recentTasks.map(task => {
            const assignee = mockUsers.find(u => u.id === task.assignedTo);
            return (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.client} · Assigned to {assignee?.name}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-sm">Active Projects</h3>
        </div>
        <div className="divide-y">
          {mockProjects.filter(p => p.status === 'active').map(proj => {
            const progress = Math.round((proj.completedTasks / proj.taskCount) * 100);
            const lead = mockUsers.find(u => u.id === proj.teamLeadId);
            return (
              <div key={proj.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">{proj.client} · Lead: {lead?.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{proj.completedTasks}/{proj.taskCount} tasks · Due {proj.deadline}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
