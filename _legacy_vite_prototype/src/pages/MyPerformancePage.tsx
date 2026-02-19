import { mockPerformance, mockUsers } from '@/data/mockData';
import { useRole } from '@/context/AuthContext';
import { TrendingUp, CheckSquare, XCircle, Clock, FileText, MessageSquare, Star } from 'lucide-react';

export default function MyPerformancePage() {
  const { currentUser } = useRole();
  const myScore = mockPerformance.find(p => p.userId === currentUser.id);
  const allScores = [...mockPerformance].sort((a, b) => b.totalScore - a.totalScore);
  const myRank = allScores.findIndex(p => p.userId === currentUser.id) + 1;

  if (!myScore) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Performance data not available yet
    </div>
  );

  const scoreItems = [
    { label: 'Completed Tasks', value: myScore.completedTasks, points: myScore.completedTasks * 2, icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Rejected Tasks', value: myScore.rejectedTasks, points: -myScore.rejectedTasks, icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
    { label: 'On-time Deliveries', value: myScore.onTimeDeliveries, points: myScore.onTimeDeliveries, icon: Clock, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Research Submissions', value: myScore.researchSubmissions, points: myScore.researchSubmissions, icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Brainstorm Ideas', value: myScore.brainstormContributions, points: myScore.brainstormContributions * 0.5, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Performance</h1>
        <p className="text-muted-foreground text-sm">Your performance breakdown and score</p>
      </div>

      {/* Score Hero */}
      <div className="bg-card border rounded-xl p-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Star className="h-5 w-5 text-warning" />
          <span className="text-sm text-muted-foreground font-medium">Performance Score</span>
        </div>
        <div className="text-7xl font-bold text-primary mb-2">{myScore.totalScore}</div>
        <div className="text-muted-foreground text-sm">Rank #{myRank} out of {allScores.length} interns</div>
        <div className="mt-4 max-w-xs mx-auto h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${myScore.totalScore}%`,
              background: myScore.totalScore >= 85 ? 'hsl(var(--success))' : myScore.totalScore >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'
            }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-5 border-b flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Score Breakdown</h3>
        </div>
        <div className="divide-y">
          {scoreItems.map(item => (
            <div key={item.label} className="flex items-center gap-4 p-4">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value} {item.label.toLowerCase()}</p>
              </div>
              <div className={`text-lg font-bold ${item.points >= 0 ? 'text-success' : 'text-danger'}`}>
                {item.points >= 0 ? '+' : ''}{item.points}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-4 bg-primary/5">
            <span className="font-semibold">Total Score</span>
            <span className="text-2xl font-bold text-primary">{myScore.totalScore}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard position */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-sm">Leaderboard</h3>
        </div>
        <div className="divide-y">
          {allScores.map((perf, index) => {
            const user = mockUsers.find(u => u.id === perf.userId);
            if (!user) return null;
            const isMe = user.id === currentUser.id;
            return (
              <div key={perf.userId} className={`flex items-center gap-3 p-3 ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                <span className="text-sm font-bold w-8 text-center text-muted-foreground">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{user.avatar}</div>
                <span className="flex-1 text-sm font-medium">{user.name} {isMe && <span className="text-primary text-xs">(You)</span>}</span>
                <span className="font-bold text-primary">{perf.totalScore}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
