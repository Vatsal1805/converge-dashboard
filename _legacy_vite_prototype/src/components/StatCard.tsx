import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, iconBg, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-card border rounded-xl p-5 flex flex-col gap-3 animate-fade-in', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', iconBg || 'bg-primary/10')}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
        {trend && (
          <div className={cn('text-xs font-medium mt-1', trend.positive ? 'text-success' : 'text-danger')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
