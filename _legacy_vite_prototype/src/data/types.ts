export type Role = 'founder' | 'teamlead' | 'intern';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
  joinedAt: string;
  
  // Auth fields
  password?: string; // bcrypt hash
  status: 'active' | 'inactive';
  createdBy?: string; // founder id
  lastLogin?: string;
  
  performanceScore?: number;
}

export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'under_review' | 'completed' | 'rejected' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  client: string;
  assignedTo: string; // user id
  assignedBy: string; // user id
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  timeExpected: number; // hours
  timeLogged: number; // hours
  feedback?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';
export type LeadSource = 'instagram' | 'referral' | 'website' | 'linkedin' | 'cold_outreach' | 'other';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: LeadSource;
  assignedTo: string; // user id
  dealValue: number;
  followUpDate: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  teamLeadId: string;
  budget: number;
  deadline: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  description: string;
  taskCount: number;
  completedTasks: number;
  createdAt: string;
}

export interface IdeaComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  authorId: string;
  tags: string[];
  upvotes: string[]; // user ids who upvoted
  comments: IdeaComment[];
  approved: boolean;
  attachments: string[];
  createdAt: string;
}

export type ResearchCategory = 'market_research' | 'competitor_analysis' | 'strategy' | 'industry_report' | 'other';
export type ResearchStatus = 'pending_review' | 'approved' | 'rejected';

export interface ResearchDoc {
  id: string;
  title: string;
  description: string;
  authorId: string;
  projectId: string;
  category: ResearchCategory;
  status: ResearchStatus;
  fileName: string;
  fileSize: string;
  feedback?: string;
  createdAt: string;
}

export interface PerformanceScore {
  userId: string;
  completedTasks: number;
  rejectedTasks: number;
  onTimeDeliveries: number;
  researchSubmissions: number;
  brainstormContributions: number;
  totalScore: number;
  rank: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'lead' | 'review' | 'system';
  read: boolean;
  createdAt: string;
}
