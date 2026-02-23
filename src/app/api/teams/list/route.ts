import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import { Types } from 'mongoose';

export async function GET(request: Request) {
    try {
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const role = (session as any).role;
        const userId = new Types.ObjectId((session as any).id);

        let query: any = { status: 'active' };

        // Team leads can see their own teams
        if (role === 'teamlead') {
            query.teamLeadId = userId;
        }
        // Interns can see teams they're part of
        else if (role === 'intern') {
            query.members = userId;
        }
        // Founders can see all teams (no additional filter)

        const teams = await Team.find(query)
            .populate('teamLeadId', 'name email department')
            .populate('members', 'name email department performanceScore')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ teams });

    } catch (error) {
        console.error('List Teams Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
