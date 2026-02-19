
# ConvergeOS – Internal Task & Operations System

## What We're Building
A fully functional internal operations platform for Converge Digitals with role-based dashboards, task management, CRM, brainstorming, and performance tracking — built as a frontend app with mock data (no backend required to start).

---

## Phase 1: Foundation & Navigation

**App Shell**
- Sidebar navigation that changes based on role (Founder / Team Lead / Intern)
- Role switcher (for demo/testing purposes) so you can preview all three dashboards
- Dark & professional design with a branded color palette (deep navy + electric blue accent)
- Top bar with user avatar, notifications bell, and role badge

---

## Phase 2: Dashboards (3 Role Views)

**Founder Dashboard**
- Company overview cards: Active Projects, Total Interns, Tasks Completed This Week, Overdue Tasks, Revenue This Month
- Lead pipeline funnel (New → Contacted → Converted → Lost)
- Performance chart showing top interns and department productivity
- Quick-access links to all modules

**Team Lead Dashboard**
- My Projects summary
- Team task status breakdown (Pending / In Progress / Under Review / Completed)
- Pending reviews requiring action
- Intern productivity scores
- Issues raised tracker

**Intern Dashboard**
- Personal task cards: Assigned, In Progress, Due Today, Completed
- Hours logged this week
- My performance score with breakdown
- Quick submit research/work button

---

## Phase 3: Core Modules

**Task Engine**
- Full task list with filters (by status, priority, assignee, project)
- Task detail view with all fields: ID, Project, Client, Intern, Deadline, Priority, Status, Time Logged, Feedback, Attachments
- Status flow: Pending → Accepted → In Progress → Under Review → Completed / Rejected
- Create/Edit task form (Founder & Team Lead)
- Inline status updates (Intern can move their tasks forward)

**Lead & CRM Module**
- Lead cards/table with: Name, Company, Phone, Email, Source, Assigned To, Deal Value, Follow-up Date, Status
- Kanban-style pipeline view (New / Contacted / Converted / Lost)
- Add/Edit lead form
- Filter by source and assigned team member

**Brainstorm Room**
- Feed-style idea posts (like internal social)
- Post idea with title, description, file attachment option
- Comment, tag team members, upvote ideas
- Idea approval badge system

**Research Vault**
- Upload/submit research documents (mock upload)
- Tag to project and category (Market Research, Competitor Analysis, Strategy, etc.)
- Review status (Pending Review / Approved)
- Searchable & filterable vault

**Performance Scoring**
- Auto-calculated score per intern based on: completed tasks, rejection rate, deadline adherence, research submissions
- Score cards with visual progress bars
- Leaderboard view for Founder/Team Lead

---

## Phase 4: Users & Settings

**User Management (Founder view)**
- List of all users with role badges
- Create new user (Team Lead or Intern)
- Assign to department

**Settings Page**
- Company profile
- Department management
- Notification preferences

---

## Design Style
- **Dark & Professional** — deep navy sidebar (#0F172A), clean white content area, electric blue (#3B82F6) accents
- Smooth sidebar collapse to icon-only mini mode
- Card-based layouts with subtle shadows
- Status badges with color coding (green/yellow/orange/red)
- Charts using Recharts (already installed)

---

## Tech Approach
- Pure frontend with React + TypeScript
- Mock data for all users, tasks, leads, and projects
- Role-based routing and sidebar (no real auth — demo role switcher)
- All modules accessible from sidebar based on current role
- Recharts for analytics and performance charts
