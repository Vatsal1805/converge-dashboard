import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { mockUsers } from '@/data/mockData';
import { getStoredUsers, hashPassword } from '@/lib/auth';
import { User, Role } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Mail, Calendar, UserCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const roleBadge: Record<string, string> = {
  founder: 'bg-primary/10 text-primary border-primary/20',
  teamlead: 'bg-success/10 text-success border-success/20',
  intern: 'bg-warning/10 text-warning border-warning/20',
};

export default function UsersPage() {
  const { currentRole, currentUser, createUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'intern' as Role,
    department: 'Marketing',
    status: 'active' as 'active' | 'inactive'
  });

  // Combine mock users (legacy) with stored users (auth system)
  // In a real app, this would come from one API source
  const storedUsers = getStoredUsers();

  // De-duplicate: prefer stored users over mock if IDs clash (though they shouldn't with UUIDs)
  // For this demo, let's just display stored users primarily, but if none exist (fresh wipe except founder), show mocks?
  // Actually, getStoredUsers() includes the seeded founder. 
  // Let's merge them but filter duplicates by email to be safe.
  const allUsersMap = new Map<string, User>();

  [...mockUsers, ...storedUsers].forEach(u => {
    if (!allUsersMap.has(u.email)) {
      allUsersMap.set(u.email, u);
    } else {
      // If we differ, prefer the one with password/status (stored one)
      const existing = allUsersMap.get(u.email)!;
      if (!existing.password && u.password) {
        allUsersMap.set(u.email, u);
      }
    }
  });

  const allUsers = Array.from(allUsersMap.values());

  const users = currentRole === 'teamlead'
    ? allUsers.filter(u => u.department === currentUser?.department && u.role === 'intern')
    : allUsers.filter(u => u.role !== 'founder' || u.id === currentUser?.id); // Show self if founder

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const pageTitle = currentRole === 'teamlead' ? 'Team Members' : 'User Management';

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;

    const hashedPassword = hashPassword(newUser.password);

    const success = await createUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      status: newUser.status,
      password: hashedPassword,
      avatar: newUser.name.charAt(0).toUpperCase(),
      createdBy: currentUser?.id,
    });

    if (success) {
      setShowCreate(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'intern',
        department: 'Marketing',
        status: 'active'
      });
      // Force re-render or refetch would happen in real app
      // Here React state update on context might not trigger immediate re-read of localStorage in this component
      // But createUser updates localStorage. We might need to force update or rely on context list.
      // Ideally AuthContext should expose a users list or we pull from there.
      // For now, simple window reload to refresh the list is easiest for this non-server architecture
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} members</p>
        </div>
        {currentRole === 'founder' && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create New User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Full Name</Label><Input className="mt-1" placeholder="Full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="email@company.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input className="mt-1" type="password" placeholder="Min 6 characters" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(v: Role) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teamlead">Team Lead</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Department</Label>
                    <Select value={newUser.department} onValueChange={v => setNewUser({ ...newUser, department: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Content">Content</SelectItem>
                        <SelectItem value="Strategy">Strategy</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div><Label>Status</Label>
                  <Select value={newUser.status} onValueChange={(v: 'active' | 'inactive') => setNewUser({ ...newUser, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleCreateUser}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(user => (
          <div key={user.id} className={`bg-card border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow relative overflow-hidden ${user.status === 'inactive' ? 'opacity-70 grayscale' : ''}`}>
            {user.status === 'inactive' && <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] px-2 py-1 font-bold">INACTIVE</div>}

            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{user.name}</span>
                <Badge variant="outline" className={`text-xs ${roleBadge[user.role]}`}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.department}</p>

              {user.lastLogin && (
                <p className="text-[10px] text-muted-foreground mt-2">Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
              )}

              {user.performanceScore !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-semibold text-primary">{user.performanceScore}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${user.performanceScore}%`,
                        background: (user.performanceScore ?? 0) >= 80 ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
