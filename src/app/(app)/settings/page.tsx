'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Settings, User, Bell, Shield, Palette, Globe, 
    Mail, Key, Smartphone, Moon, Sun, Save, Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Profile Settings
    const [profile, setProfile] = useState({
        name: 'Founder',
        email: 'founder@gmail.com',
        phone: '',
        timezone: 'UTC',
    });

    // Notification Settings
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        taskReminders: true,
        projectUpdates: true,
        weeklyDigest: false,
        mobileNotifications: true,
    });

    // Appearance Settings
    const [appearance, setAppearance] = useState({
        theme: 'system',
        compactMode: false,
    });

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            {saved && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Settings saved successfully!
                    </AlertDescription>
                </Alert>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4 hidden sm:block" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4 hidden sm:block" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4 hidden sm:block" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4 hidden sm:block" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal information and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={profile.timezone} onValueChange={v => setProfile({ ...profile, timezone: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                                            <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                                            <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                                            <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>Configure which email notifications you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                                </div>
                                <Switch
                                    checked={notifications.emailNotifications}
                                    onCheckedChange={(v: boolean) => setNotifications({ ...notifications, emailNotifications: v })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Task Reminders</Label>
                                    <p className="text-sm text-muted-foreground">Get reminders for upcoming task deadlines</p>
                                </div>
                                <Switch
                                    checked={notifications.taskReminders}
                                    onCheckedChange={(v: boolean) => setNotifications({ ...notifications, taskReminders: v })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Project Updates</Label>
                                    <p className="text-sm text-muted-foreground">Receive updates when projects are modified</p>
                                </div>
                                <Switch
                                    checked={notifications.projectUpdates}
                                    onCheckedChange={(v: boolean) => setNotifications({ ...notifications, projectUpdates: v })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Digest</Label>
                                    <p className="text-sm text-muted-foreground">Get a weekly summary of activity</p>
                                </div>
                                <Switch
                                    checked={notifications.weeklyDigest}
                                    onCheckedChange={(v: boolean) => setNotifications({ ...notifications, weeklyDigest: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Push Notifications</CardTitle>
                            <CardDescription>Configure mobile and browser notifications.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Mobile Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive push notifications on your mobile device</p>
                                </div>
                                <Switch
                                    checked={notifications.mobileNotifications}
                                    onCheckedChange={(v: boolean) => setNotifications({ ...notifications, mobileNotifications: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme</CardTitle>
                            <CardDescription>Select your preferred theme.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                {['light', 'dark', 'system'].map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => setAppearance({ ...appearance, theme })}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            appearance.theme === theme 
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            {theme === 'light' && <Sun className="h-6 w-6" />}
                                            {theme === 'dark' && <Moon className="h-6 w-6" />}
                                            {theme === 'system' && <Settings className="h-6 w-6" />}
                                            <span className="text-sm font-medium capitalize">{theme}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Display</CardTitle>
                            <CardDescription>Customize the interface display options.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Compact Mode</Label>
                                    <p className="text-sm text-muted-foreground">Use a more compact interface layout</p>
                                </div>
                                <Switch
                                    checked={appearance.compactMode}
                                    onCheckedChange={(v: boolean) => setAppearance({ ...appearance, compactMode: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>Add an extra layer of security to your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Authenticator App</p>
                                        <p className="text-sm text-muted-foreground">Not configured</p>
                                    </div>
                                </div>
                                <Button variant="outline">Setup</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
