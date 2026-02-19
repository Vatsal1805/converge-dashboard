import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Project from '@/models/Project';
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

        if (role === 'teamlead') {
            query = { teamLeadId: userId };
        } else if (role === 'intern') {
            // Logic for interns: usually they see projects they have tasks in. 
            // This requires a join with Tasks or separate query. 
            // For MVP, maybe they strictly see nothing here OR we add 'members' array to Project?
            // Leaving strict for now: return empty or handled in Task module.
            // Or maybe allow read-only access to all projects for context?
            // Requirement: "Intern can only see assigned tasks." implies strictness.
            query = { _id: { $exists: false } }; // Return nothing
        }

        const projects = await Project.find(query)
            .populate('teamLeadId', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json({ projects });

    } catch (error) {
        console.error('List Projects Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
