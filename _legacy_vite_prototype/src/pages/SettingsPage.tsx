import { Building2, Bell, Users, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your company and workspace preferences</p>
      </div>

      {/* Company Profile */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Company Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Company Name</Label><Input className="mt-1" defaultValue="Converge Digitals" /></div>
          <div><Label>Industry</Label><Input className="mt-1" defaultValue="Digital Marketing & Design" /></div>
          <div><Label>Website</Label><Input className="mt-1" defaultValue="convergedigitals.com" /></div>
          <div><Label>Location</Label><Input className="mt-1" defaultValue="Mumbai, India" /></div>
        </div>
        <div><Label>Company Bio</Label>
          <textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue="We are a full-service digital agency helping brands grow through creative strategy, design, and marketing." />
        </div>
        <Button>Save Changes</Button>
      </div>

      {/* Departments */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Departments</h3>
        </div>
        <div className="space-y-2">
          {['Marketing', 'Design', 'Content', 'Strategy', 'Development'].map(dept => (
            <div key={dept} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
              <span className="text-sm font-medium">{dept}</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">Rename</Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="gap-2"><span>+</span> Add Department</Button>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Notification Preferences</h3>
        </div>
        {[
          { label: 'Task Assignments', desc: 'When a new task is assigned to you' },
          { label: 'Task Reviews', desc: 'When a task is submitted for review' },
          { label: 'Task Approvals', desc: 'When your submitted task is approved' },
          { label: 'New Leads', desc: 'When a new lead is added to CRM' },
          { label: 'Performance Updates', desc: 'Weekly performance score updates' },
          { label: 'Idea Approvals', desc: 'When your brainstorm idea is approved' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch defaultChecked />
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Security</h3>
        </div>
        <div>
          <Label>Current Password</Label>
          <Input className="mt-1" type="password" placeholder="Enter current password" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>New Password</Label><Input className="mt-1" type="password" placeholder="New password" /></div>
          <div><Label>Confirm Password</Label><Input className="mt-1" type="password" placeholder="Confirm new password" /></div>
        </div>
        <Button>Update Password</Button>
      </div>
    </div>
  );
}
