import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Lead from '@/models/Lead';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        const role = (session as any)?.role;

        if (!session || role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        // Get counts
        const [
            totalUsers,
            totalInterns,
            totalTeamLeads,
            totalProjects,
            activeProjects,
            completedProjects,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            totalLeads,
            convertedLeads,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'intern' }),
            User.countDocuments({ role: 'teamlead' }),
            Project.countDocuments({}),
            Project.countDocuments({ status: 'in_progress' }),
            Project.countDocuments({ status: 'completed' }),
            Task.countDocuments({}),
            Task.countDocuments({ status: 'completed' }),
            Task.countDocuments({ status: 'todo' }),
            Task.countDocuments({ status: 'in_progress' }),
            Lead.countDocuments({}),
            Lead.countDocuments({ status: 'converted' }),
        ]);

        // Get top performers
        const topPerformers = await User.find({ role: 'intern' })
            .select('name email department performanceScore')
            .sort({ performanceScore: -1 })
            .limit(5);

        // Get recent projects
        const recentProjects = await Project.find({})
            .select('name clientName status priority deadline')
            .populate('teamLeadId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get overdue tasks
        const overdueTasks = await Task.countDocuments({
            status: { $ne: 'completed' },
            deadline: { $lt: new Date() },
        });

        // Department breakdown
        const departmentStats = await User.aggregate([
            { $match: { role: 'intern' } },
            { $group: { _id: '$department', count: { $sum: 1 }, avgScore: { $avg: '$performanceScore' } } },
        ]);

        // Task completion rate by status
        const tasksByStatus = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        // Lead conversion rate
        const leadsByStatus = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        return NextResponse.json({
            overview: {
                totalUsers,
                totalInterns,
                totalTeamLeads,
                totalProjects,
                activeProjects,
                completedProjects,
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                totalLeads,
                convertedLeads,
                overdueTasks,
                taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                leadConversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
            },
            topPerformers,
            recentProjects,
            departmentStats,
            tasksByStatus,
            leadsByStatus,
        });
    } catch (error) {
        console.error('Reports Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
