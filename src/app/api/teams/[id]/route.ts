import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getUserFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;

        const team = await Team.findById(id)
            .populate('teamLeadId', 'name email department')
            .populate('members', 'name email department performanceScore')
            .populate('createdBy', 'name email')
            .lean();

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        return NextResponse.json({ team });

    } catch (error) {
        console.error('Get Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getUserFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder') {
            return NextResponse.json({ error: 'Only founders can update teams' }, { status: 403 });
        }

        await connectToDatabase();
        const { id } = await params;
        const body = await request.json();

        const { name, description, teamLeadId, members, department, status } = body;

        // Verify team lead if updated
        if (teamLeadId) {
            const teamLead = await User.findById(teamLeadId);
            if (!teamLead || teamLead.role !== 'teamlead') {
                return NextResponse.json({ error: 'Invalid team lead' }, { status: 400 });
            }
        }

        // Verify members if updated
        if (members && members.length > 0) {
            const memberUsers = await User.find({
                _id: { $in: members },
                role: 'intern'
            });

            if (memberUsers.length !== members.length) {
                return NextResponse.json({ error: 'Some members are not valid interns' }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (teamLeadId !== undefined) updateData.teamLeadId = teamLeadId;
        if (members !== undefined) updateData.members = members;
        if (department !== undefined) updateData.department = department;
        if (status !== undefined) updateData.status = status;

        const team = await Team.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('teamLeadId', 'name email department')
            .populate('members', 'name email department performanceScore');

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        return NextResponse.json({ team });

    } catch (error) {
        console.error('Update Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getUserFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder') {
            return NextResponse.json({ error: 'Only founders can delete teams' }, { status: 403 });
        }

        await connectToDatabase();
        const { id } = await params;

        const team = await Team.findByIdAndDelete(id);

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Team deleted successfully' });

    } catch (error) {
        console.error('Delete Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
