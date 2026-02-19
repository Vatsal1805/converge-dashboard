import { mockProjects, mockUsers } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { Briefcase, Users, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-danger/10 text-danger border-danger/20',
};

export default function ProjectsPage() {
  const { currentRole, currentUser } = useRole();

  const projects = currentRole === 'teamlead'
    ? mockProjects.filter(p => p.teamLeadId === currentUser.id)
    : mockProjects;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground text-sm">{projects.length} projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(proj => {
          const lead = mockUsers.find(u => u.id === proj.teamLeadId);
          const progress = Math.round((proj.completedTasks / proj.taskCount) * 100);

          return (
            <div key={proj.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold">{proj.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{proj.client}</p>
                </div>
                <Badge variant="outline" className={cn('text-xs flex-shrink-0', statusStyles[proj.status])}>
                  {proj.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{proj.description}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{proj.completedTasks}/{proj.taskCount} tasks</span>
                  <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{lead?.avatar}</div>
                  <span>{lead?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {proj.deadline}
                </div>
                <div className="font-semibold text-success">₹{(proj.budget / 1000).toFixed(0)}K</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
