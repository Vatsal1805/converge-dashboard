import { TaskStatus, TaskPriority, LeadStatus, ResearchStatus } from '@/data/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  accepted: { label: 'Accepted', className: 'bg-info/10 text-info border-info/20' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
  under_review: { label: 'Under Review', className: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-danger/10 text-danger border-danger/20' },
  overdue: { label: 'Overdue', className: 'bg-danger/20 text-danger border-danger/30 font-semibold' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-info/10 text-info border-info/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
  urgent: { label: 'Urgent', className: 'bg-danger/10 text-danger border-danger/20' },
};

const leadStatusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-info/10 text-info border-info/20' },
  contacted: { label: 'Contacted', className: 'bg-warning/10 text-warning border-warning/20' },
  converted: { label: 'Converted', className: 'bg-success/10 text-success border-success/20' },
  lost: { label: 'Lost', className: 'bg-danger/10 text-danger border-danger/20' },
};

const researchStatusConfig: Record<ResearchStatus, { label: string; className: string }> = {
  pending_review: { label: 'Pending Review', className: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-danger/10 text-danger border-danger/20' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const cfg = statusConfig[status];
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium', cfg.className)}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = priorityConfig[priority];
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium', cfg.className)}>{cfg.label}</span>;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = leadStatusConfig[status];
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium', cfg.className)}>{cfg.label}</span>;
}

export function ResearchStatusBadge({ status }: { status: ResearchStatus }) {
  const cfg = researchStatusConfig[status];
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium', cfg.className)}>{cfg.label}</span>;
}
