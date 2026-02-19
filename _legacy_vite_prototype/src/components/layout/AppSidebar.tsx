import { NavLink } from '@/components/NavLink';
import { useRole } from '@/context/AuthContext';
import { Role } from '@/data/types';
import {
  LayoutDashboard, CheckSquare, Briefcase, Users, TrendingUp,
  MessageSquare, FileText, BarChart2, Settings, Target, ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['founder', 'teamlead', 'intern'] },
  { label: 'Projects', to: '/projects', icon: Briefcase, roles: ['founder', 'teamlead'] },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare, roles: ['founder', 'teamlead', 'intern'] },
  { label: 'My Tasks', to: '/my-tasks', icon: CheckSquare, roles: ['intern'] },
  { label: 'Leads & CRM', to: '/leads', icon: Target, roles: ['founder', 'teamlead'] },
  { label: 'Brainstorm', to: '/brainstorm', icon: MessageSquare, roles: ['founder', 'teamlead', 'intern'] },
  { label: 'Research Vault', to: '/research', icon: FileText, roles: ['founder', 'teamlead', 'intern'] },
  { label: 'Performance', to: '/performance', icon: BarChart2, roles: ['founder', 'teamlead'] },
  { label: 'My Performance', to: '/my-performance', icon: TrendingUp, roles: ['intern'] },
  { label: 'Team Members', to: '/team', icon: Users, roles: ['teamlead'] },
  { label: 'Users', to: '/users', icon: Users, roles: ['founder'] },
  { label: 'Reports', to: '/reports', icon: BarChart2, roles: ['founder'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['founder', 'teamlead'] },
];

export function AppSidebar() {
  const { currentRole } = useRole();
  const [collapsed, setCollapsed] = useState(false);

  const visible = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0', collapsed && 'justify-center px-0')}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-none">ConvergeOS</p>
            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Converge Digitals</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group',
              collapsed && 'justify-center px-0'
            )}
            activeClassName="bg-primary/15 text-primary font-medium hover:bg-primary/20 hover:text-primary"
          >
            <item.icon className={cn('h-4 w-4 flex-shrink-0', collapsed ? 'mx-auto' : '')} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent', collapsed && 'px-0')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" /><span>Collapse</span></>}
        </Button>
      </div>
    </aside>
  );
}
