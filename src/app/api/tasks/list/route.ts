import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import Project from '@/models/Project';
import mongoose from 'mongoose';

export async function GET(request: Request) {
    try {
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        let query = {};
        const role = (session as any).role;
        const userId = (session as any).id;

        if (role === 'intern') {
            query = { assignedTo: userId };
        } else if (role === 'teamlead') {
            // Fetch team lead's department
            const teamLead = await User.findById(userId).select('department').lean();
            if (teamLead) {
                // Find all interns in the same department
                const interns = await User.find({
                    department: teamLead.department,
                    role: 'intern'
                }).select('_id').lean();

                const internIds = interns.map((i: any) => i._id);
                query = { assignedTo: { $in: internIds } };
            }
        }

        // Performance Optimization: Use .lean() for faster execution and .select() to reduce payload size
        const [tasks, total] = await Promise.all([
            Task.find(query)
                .select('title status priority deadline projectId assignedTo internStatus internNote createdAt description')
                .populate({
                    path: 'projectId',
                    select: 'name clientName'
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email'
                })
                .sort({ deadline: 1 })
                .skip(skip)
                .limit(limit)
                .lean(), // lean() returns plain JS objects, bypassing hydration
            Task.countDocuments(query)
        ]);

        return NextResponse.json({
            tasks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Tasks Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
