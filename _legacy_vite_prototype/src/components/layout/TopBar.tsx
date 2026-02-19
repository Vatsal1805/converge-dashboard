import { useAuth } from '@/context/AuthContext';
import { Role } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut } from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleLabels: Record<Role, string> = {
  founder: 'Founder',
  teamlead: 'Team Lead',
  intern: 'Intern',
};

const roleBadgeStyle: Record<Role, string> = {
  founder: 'bg-primary/10 text-primary border-primary/20',
  teamlead: 'bg-success/10 text-success border-success/20',
  intern: 'bg-warning/10 text-warning border-warning/20',
};

export function TopBar() {
  const { currentUser, currentRole, logout } = useAuth();
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  if (!currentUser || !currentRole) return null;

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">ConvergeOS</h2>
          <p className="text-xs text-muted-foreground">Converge Digitals Internal Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <Badge variant="outline" className={`text-xs font-medium ${roleBadgeStyle[currentRole]}`}>
          {roleLabels[currentRole]}
        </Badge>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.slice(0, 4).map(n => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2 w-full">
                  <span className={`font-medium text-sm ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                  {!n.read && <span className="ml-auto h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground">{currentUser.department}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
