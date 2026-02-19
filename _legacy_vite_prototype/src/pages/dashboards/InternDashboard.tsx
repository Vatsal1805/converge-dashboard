import { mockTasks, mockUsers, mockPerformance } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { StatCard } from '@/components/StatCard';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { CheckSquare, Clock, Calendar, TrendingUp, Upload, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InternDashboard() {
  const { currentUser } = useRole();

  const myTasks = mockTasks.filter(t => t.assignedTo === currentUser.id);
  const assigned = myTasks.filter(t => t.status === 'pending' || t.status === 'accepted').length;
  const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
  const today = new Date().toISOString().split('T')[0];
  const dueToday = myTasks.filter(t => t.deadline === today && !['completed', 'rejected'].includes(t.status)).length;
  const completed = myTasks.filter(t => t.status === 'completed').length;

  const myScore = mockPerformance.find(p => p.userId === currentUser.id);
  const hoursLogged = myTasks.reduce((sum, t) => sum + t.timeLogged, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Welcome back, {currentUser.name.split(' ')[0]}! 👋</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Submit Research
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Assigned" value={assigned} subtitle="Pending acceptance" icon={<CheckSquare className="h-4 w-4 text-primary" />} iconBg="bg-primary/10" />
        <StatCard title="In Progress" value={inProgress} subtitle="Active tasks" icon={<Clock className="h-4 w-4 text-info" />} iconBg="bg-info/10" />
        <StatCard title="Due Today" value={dueToday} subtitle="Today's deadline" icon={<Calendar className="h-4 w-4 text-warning" />} iconBg="bg-warning/10" />
        <StatCard title="Completed" value={completed} subtitle="This month" icon={<TrendingUp className="h-4 w-4 text-success" />} iconBg="bg-success/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance Score */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-sm">My Performance Score</h3>
          </div>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-primary">{myScore?.totalScore ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">out of 100</div>
            <div className="text-xs text-muted-foreground mt-0.5">Rank #{myScore?.rank ?? '-'}</div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary rounded-full" style={{ width: `${myScore?.totalScore ?? 0}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="bg-success/10 rounded-lg p-2">
              <div className="font-bold text-success text-lg">{myScore?.completedTasks ?? 0}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="bg-danger/10 rounded-lg p-2">
              <div className="font-bold text-danger text-lg">{myScore?.rejectedTasks ?? 0}</div>
              <div className="text-muted-foreground">Rejected</div>
            </div>
            <div className="bg-info/10 rounded-lg p-2">
              <div className="font-bold text-info text-lg">{myScore?.onTimeDeliveries ?? 0}</div>
              <div className="text-muted-foreground">On Time</div>
            </div>
            <div className="bg-warning/10 rounded-lg p-2">
              <div className="font-bold text-warning text-lg">{myScore?.researchSubmissions ?? 0}</div>
              <div className="text-muted-foreground">Research</div>
            </div>
          </div>
        </div>

        {/* Hours & Stats */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Hours Logged</h3>
          </div>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-foreground">{hoursLogged}</div>
            <div className="text-sm text-muted-foreground mt-1">hours this month</div>
          </div>
          <div className="space-y-3">
            {myTasks.filter(t => t.timeLogged > 0).map(task => (
              <div key={task.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate text-muted-foreground max-w-[140px]">{task.title.slice(0, 25)}...</span>
                  <span className="font-semibold ml-2">{task.timeLogged}h</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(task.timeLogged / task.timeExpected) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start gap-2" variant="outline">
              <CheckSquare className="h-4 w-4" /> View My Tasks
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Upload className="h-4 w-4" /> Upload Research
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Star className="h-4 w-4" /> Post an Idea
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <TrendingUp className="h-4 w-4" /> View Performance
            </Button>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-sm">My Tasks</h3>
          <span className="text-xs text-muted-foreground">{myTasks.length} total</span>
        </div>
        <div className="divide-y">
          {myTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No tasks assigned to you yet</div>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Deadline: {task.deadline} · {task.timeLogged}/{task.timeExpected}h logged</p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
