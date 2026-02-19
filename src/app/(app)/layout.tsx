import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { redirect } from 'next/navigation';
import LogOutButton from '@/components/auth/LogOutButton';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/login');
    }

    const user = await verifyToken(token);

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <AppSidebar user={user as any} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 flex-shrink-0">
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        ConvergeOS
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                            Welcome, <span className="font-medium text-slate-700 dark:text-slate-200">{(user as any).name}</span>
                        </div>
                        <LogOutButton />
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
