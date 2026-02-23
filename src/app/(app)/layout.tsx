import { cookies, headers } from "next/headers";
import { verifyToken, getUserFromRequest } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { redirect } from "next/navigation";
import LogOutButton from "@/components/auth/LogOutButton";
import { SessionProvider } from "@/components/auth/SessionProvider";
import NotificationBell from "@/components/layout/NotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use getUserFromRequest which prioritizes the x-user-data header from middleware
  const user = await getUserFromRequest({ headers: await headers() });

  if (!user) {
    redirect("/login");
  }

  return (
    <SessionProvider initialUser={user as any}>
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
                Welcome,{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {(user as any).name}
                </span>
              </div>
              <NotificationBell />
              <LogOutButton />
            </div>
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
