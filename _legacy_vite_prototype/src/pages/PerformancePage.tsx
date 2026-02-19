import { mockPerformance, mockUsers } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { Trophy, TrendingUp, CheckSquare, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';

const MEDAL_COLORS = ['text-warning', 'text-muted-foreground', 'text-amber-600'];

export default function PerformancePage() {
  const { currentRole, currentUser } = useRole();

  const sorted = [...mockPerformance].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Performance Scoring</h1>
        <p className="text-muted-foreground text-sm">Auto-calculated scores based on task completion, quality, and contributions</p>
      </div>

      {/* Score Formula */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Score Formula</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-lg border border-success/20">
            <CheckSquare className="h-4 w-4" /> Completed × 2pts
          </div>
          <div className="flex items-center gap-2 bg-danger/10 text-danger px-3 py-1.5 rounded-lg border border-danger/20">
            <XCircle className="h-4 w-4" /> Rejected × -1pt
          </div>
          <div className="flex items-center gap-2 bg-info/10 text-info px-3 py-1.5 rounded-lg border border-info/20">
            <Clock className="h-4 w-4" /> On-time × 1pt
          </div>
          <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-lg border border-warning/20">
            <FileText className="h-4 w-4" /> Research × 1pt
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
            <MessageSquare className="h-4 w-4" /> Brainstorm × 0.5pt
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b">
          <Trophy className="h-4 w-4 text-warning" />
          <h3 className="font-semibold text-sm">Intern Leaderboard</h3>
        </div>
        <div className="divide-y">
          {sorted.map((perf, index) => {
            const user = mockUsers.find(u => u.id === perf.userId);
            if (!user) return null;
            const isMe = user.id === currentUser.id;

            return (
              <div key={perf.userId} className={`flex items-center gap-4 p-4 transition-colors ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/20'}`}>
                <div className={`text-lg font-bold w-8 text-center ${MEDAL_COLORS[index] || 'text-muted-foreground'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{user.name}</span>
                    {isMe && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{user.department}</span>
                </div>
                <div className="grid grid-cols-5 gap-3 text-center text-xs hidden md:grid">
                  <div><div className="font-semibold text-success">{perf.completedTasks}</div><div className="text-muted-foreground">Done</div></div>
                  <div><div className="font-semibold text-danger">{perf.rejectedTasks}</div><div className="text-muted-foreground">Rejected</div></div>
                  <div><div className="font-semibold text-info">{perf.onTimeDeliveries}</div><div className="text-muted-foreground">On-Time</div></div>
                  <div><div className="font-semibold text-warning">{perf.researchSubmissions}</div><div className="text-muted-foreground">Research</div></div>
                  <div><div className="font-semibold text-primary">{perf.brainstormContributions}</div><div className="text-muted-foreground">Ideas</div></div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[80px]">
                  <span className="text-2xl font-bold text-foreground">{perf.totalScore}</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${perf.totalScore}%`,
                        background: perf.totalScore >= 85 ? 'hsl(var(--success))' : perf.totalScore >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
