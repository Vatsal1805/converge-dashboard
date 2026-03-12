"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
  BarChart2,
  Settings,
  Target,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Role = "founder" | "teamlead" | "intern";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  // Dashboard links depend on role, we handle this dynamic link in the component or assume /dashboard connects to correct one
  // For simplicity, we point to /dashboard which redirects
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    roles: ["founder", "teamlead", "intern"],
  },
  {
    label: "Projects",
    to: "/projects",
    icon: Briefcase,
    roles: ["founder", "teamlead"],
  },
  {
    label: "My Projects",
    to: "/my-projects",
    icon: Briefcase,
    roles: ["intern"],
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: CheckSquare,
    roles: ["founder", "teamlead"],
  },
  { label: "My Tasks", to: "/my-tasks", icon: CheckSquare, roles: ["intern"] },
  {
    label: "Leads & CRM",
    to: "/leads",
    icon: Target,
    roles: ["founder"],
  },
  {
    label: "Brainstorm",
    to: "/brainstorm",
    icon: MessageSquare,
    roles: ["founder", "teamlead", "intern"],
  },
  {
    label: "Research Vault",
    to: "/research",
    icon: FileText,
    roles: ["founder", "teamlead", "intern"],
  },
  {
    label: "Performance",
    to: "/performance",
    icon: BarChart2,
    roles: ["founder", "teamlead"],
  },
  {
    label: "My Performance",
    to: "/my-performance",
    icon: TrendingUp,
    roles: ["intern"],
  },
  {
    label: "Team",
    to: "/team",
    icon: Users,
    roles: ["founder", "teamlead"],
  },
  {
    label: "Users",
    to: "/dashboard/founder/users",
    icon: Users,
    roles: ["founder"],
  }, // Explicit link for users
  { label: "Reports", to: "/reports", icon: BarChart2, roles: ["founder"] },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    roles: ["founder", "teamlead", "intern"],
  },
];

interface AppSidebarProps {
  user: {
    role: Role;
    name: string;
    department: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visible = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-shrink-0 sticky top-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/20">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-100 leading-none truncate">
              ConvergeOS
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              Converge Digitals
            </p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
        {visible.map((item) => {
          // Handle 'Dashboard' link specifically to point to the correct dashboard
          const href =
            item.label === "Dashboard" ? `/dashboard/${user.role}` : item.to;
          const isActive =
            pathname === href ||
            (item.to !== "/" && pathname.startsWith(item.to));

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-200",
                  collapsed ? "mx-auto" : "",
                )}
              />
              {!collapsed && <span>{item.label}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-14 bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info / Collapse */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        {!collapsed && (
          <div className="mb-3 px-1">
            <div className="text-xs font-medium text-slate-300 truncate">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 capitalize truncate">
              {user.role} • {user.department}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-black hover:text-black hover:bg-slate-800",
            collapsed && "px-0",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
