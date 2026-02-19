import { mockTasks, mockUsers } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const NEXT_STATUS: Record<string, string> = {
  pending: 'accepted',
  accepted: 'in_progress',
  in_progress: 'under_review',
};

export default function MyTasksPage() {
  const { currentUser } = useRole();
  const [tasks, setTasks] = useState(mockTasks.filter(t => t.assignedTo === currentUser.id));

  const advance = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      const next = NEXT_STATUS[t.status];
      return next ? { ...t, status: next as any } : t;
    }));
  };

  const ACTION_LABELS: Record<string, string> = {
    pending: 'Accept Task',
    accepted: 'Start Task',
    in_progress: 'Submit for Review',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground text-sm">{tasks.length} tasks assigned to you</p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">No tasks assigned to you yet.</div>
        ) : tasks.map(task => (
          <div key={task.id} className="bg-card border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{task.client} · Deadline: {task.deadline}</p>
                <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Time: {task.timeLogged}h / {task.timeExpected}h</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((task.timeLogged / task.timeExpected) * 100, 100)}%` }} />
                </div>
              </div>
              {NEXT_STATUS[task.status] && (
                <Button size="sm" onClick={() => advance(task.id)} className="h-8">
                  {ACTION_LABELS[task.status]}
                </Button>
              )}
              {task.status === 'under_review' && (
                <span className="text-xs text-warning font-medium">Awaiting review by Team Lead</span>
              )}
              {task.status === 'completed' && (
                <span className="text-xs text-success font-medium">✓ Completed</span>
              )}
              {task.status === 'rejected' && (
                <span className="text-xs text-danger font-medium">✗ Rejected — {task.feedback}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
