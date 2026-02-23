import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Lead from '@/models/Lead';
import { cookies } from 'next/headers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, handleAPIError } from '@/lib/errors';
import { leadSchemas, parseBody } from '@/lib/validation';
import { cache } from '@/lib/cache';

export async function POST(request: Request) {
    try {
        // ✅ Rate limiting
        const rateLimitResult = await rateLimit(request, {
            maxRequests: 40,
            windowMs: 15 * 60 * 1000,
        });

        if (rateLimitResult.limited) {
            return rateLimitResponse(rateLimitResult.resetTime);
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session || ((session as any).role !== 'founder' && (session as any).role !== 'teamlead')) {
            throw new ForbiddenError('Only founders and team leads can create leads');
        }

        // ✅ Centralized validation
        const data = await parseBody(request, leadSchemas.create);

        await connectToDatabase();

        const lead = await Lead.create({
            ...data,
            createdBy: (session as any).id,
            assignedTo: (session as any).role === 'teamlead' ? (session as any).id : undefined
        });

        // ✅ Invalidate cache
        cache.invalidateByPrefix('leads:');

        return NextResponse.json({ lead }, { status: 201 });

    } catch (error: unknown) {
        // ✅ Centralized error handling
        return handleAPIError(error);
    }
}
