import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import TasksPage from "./pages/TasksPage";
import LeadsPage from "./pages/LeadsPage";
import BrainstormPage from "./pages/BrainstormPage";
import ResearchPage from "./pages/ResearchPage";
import PerformancePage from "./pages/PerformancePage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import MyTasksPage from "./pages/MyTasksPage";
import MyPerformancePage from "./pages/MyPerformancePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/brainstorm" element={<BrainstormPage />} />
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/performance" element={<PerformancePage />} />
                <Route path="/my-performance" element={<MyPerformancePage />} />

                {/* Admin/Founder Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['founder']} />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/reports" element={<PerformancePage />} />
                </Route>

                <Route path="/team" element={<UsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
