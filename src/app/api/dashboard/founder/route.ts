import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Lead from '@/models/Lead';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'founder') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // FETCH DATA IN PARALLEL
        const [totalUsers, totalProjects, activeTasks, wonLeads] = await Promise.all([
            User.countDocuments(),
            Project.countDocuments({ status: { $in: ['planning', 'active'] } }),
            Task.countDocuments({ status: { $in: ['not_started', 'in_progress', 'under_review', 'working'] } }),
            Lead.find({ status: 'won' })
        ]);

        const revenue = wonLeads.reduce((acc, lead) => acc + (lead.dealValue || 0), 0);

        return NextResponse.json({
            totalUsers,
            totalProjects,
            activeTasks,
            revenue
        });
    } catch (error: any) {
        console.error('Founder Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
