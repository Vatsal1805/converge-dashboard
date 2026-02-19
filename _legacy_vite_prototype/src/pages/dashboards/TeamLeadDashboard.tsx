import { mockTasks, mockProjects, mockUsers, mockPerformance } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { StatCard } from '@/components/StatCard';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Briefcase, CheckSquare, Clock, AlertTriangle, Star, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeamLeadDashboard() {
  const { currentUser } = useRole();

  const myProjects = mockProjects.filter(p => p.teamLeadId === currentUser.id);
  const myInterns = mockUsers.filter(u => u.role === 'intern' && u.department === currentUser.department);

  const teamTasks = mockTasks.filter(t => {
    const assignee = mockUsers.find(u => u.id === t.assignedTo);
    return assignee?.department === currentUser.department;
  });

  const pendingReviews = teamTasks.filter(t => t.status === 'under_review').length;
  const inProgressTasks = teamTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = teamTasks.filter(t => t.status === 'overdue').length;

  const taskStatusData = [
    { name: 'Pending', value: teamTasks.filter(t => t.status === 'pending').length },
    { name: 'Accepted', value: teamTasks.filter(t => t.status === 'accepted').length },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Review', value: pendingReviews },
    { name: 'Done', value: completedTasks },
  ];

  const internScores = mockPerformance
    .filter(p => myInterns.some(i => i.id === p.userId))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(p => ({
      name: mockUsers.find(u => u.id === p.userId)?.name?.split(' ')[0] || '',
      score: p.totalScore,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Team Lead Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{currentUser.department} Department · {currentUser.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="My Projects" value={myProjects.length} subtitle="Active assignments" icon={<Briefcase className="h-4 w-4 text-primary" />} iconBg="bg-primary/10" />
        <StatCard title="Pending Reviews" value={pendingReviews} subtitle="Awaiting your review" icon={<Eye className="h-4 w-4 text-warning" />} iconBg="bg-warning/10" />
        <StatCard title="In Progress" value={inProgressTasks} subtitle="Team tasks" icon={<Clock className="h-4 w-4 text-info" />} iconBg="bg-info/10" />
        <StatCard title="Overdue" value={overdueTasks} subtitle="Needs action" icon={<AlertTriangle className="h-4 w-4 text-danger" />} iconBg="bg-danger/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Status Chart */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Team Task Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Intern Productivity */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">Intern Productivity Scores</h3>
          </div>
          {myInterns.map(intern => {
            const score = mockPerformance.find(p => p.userId === intern.id)?.totalScore || 0;
            return (
              <div key={intern.id} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{intern.name}</span>
                  <span className="text-sm font-bold text-primary">{score}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${score}%`,
                      background: score >= 80 ? 'hsl(var(--success))' : score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-sm">Tasks Awaiting Review</h3>
          <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">{pendingReviews} pending</span>
        </div>
        <div className="divide-y">
          {teamTasks.filter(t => t.status === 'under_review').map(task => {
            const assignee = mockUsers.find(u => u.id === task.assignedTo);
            return (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{assignee?.name} · Due {task.deadline}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            );
          })}
          {pendingReviews === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No tasks pending review</div>
          )}
        </div>
      </div>

      {/* My Projects */}
      <div className="bg-card border rounded-xl">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-sm">My Projects</h3>
        </div>
        <div className="divide-y">
          {myProjects.map(proj => {
            const progress = Math.round((proj.completedTasks / proj.taskCount) * 100);
            return (
              <div key={proj.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">{proj.client} · Deadline: {proj.deadline}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{proj.completedTasks}/{proj.taskCount} tasks completed</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
