import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import { Types } from 'mongoose';

export async function POST(request: Request) {
    try {
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder') {
            return NextResponse.json({ error: 'Only founders can create teams' }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const { name, description, teamLeadId, members, department } = body;

        if (!name || !teamLeadId || !department) {
            return NextResponse.json({ error: 'Name, team lead, and department are required' }, { status: 400 });
        }

        // Verify team lead exists and has correct role
        const teamLead = await User.findById(teamLeadId);
        if (!teamLead) {
            return NextResponse.json({ error: 'Team lead not found' }, { status: 404 });
        }
        if (teamLead.role !== 'teamlead') {
            return NextResponse.json({ error: 'Selected user is not a team lead' }, { status: 400 });
        }

        // Verify all members exist and are interns
        if (members && members.length > 0) {
            const memberUsers = await User.find({
                _id: { $in: members },
                role: 'intern'
            });

            if (memberUsers.length !== members.length) {
                return NextResponse.json({ error: 'Some members are not valid interns' }, { status: 400 });
            }
        }

        const team = await Team.create({
            name,
            description,
            teamLeadId,
            members: members || [],
            department,
            status: 'active',
            createdBy: (session as any).id
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('teamLeadId', 'name email')
            .populate('members', 'name email department')
            .lean();

        return NextResponse.json({ team: populatedTeam }, { status: 201 });

    } catch (error) {
        console.error('Create Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
