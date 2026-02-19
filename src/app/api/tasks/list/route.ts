import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        let query = {};
        const role = (session as any).role;
        const userId = (session as any).id;

        if (role === 'intern') {
            query = { assignedTo: userId };
        }
        // Team Lead might see projects they lead, found by filtering Tasks where Project.teamLeadId == userId?
        // This is complex in NoSQL without aggregation.
        // For now, Team Lead sees all tasks (simplification) or just createdBy them?
        else if (role === 'teamlead') {
            // Ideally filter by project team lead or created by
            // query = { createdBy: userId }; 
            // But they need to see tasks created by founder for their team too.
            // Let's leave it open as "Manager View" for now.
        }

        const tasks = await Task.find(query)
            .populate('projectId', 'name clientName')
            .populate('assignedTo', 'name email')
            .sort({ deadline: 1 });

        return NextResponse.json({ tasks });

    } catch (error) {
        console.error('List Tasks Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
