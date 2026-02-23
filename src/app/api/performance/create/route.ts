import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, handleAPIError } from '@/lib/errors';
import { performanceSchemas, parseBody } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { cache } from '@/lib/cache';

export async function POST(request: Request) {
    try {
        // ✅ Rate limiting
        const rateLimitResult = await rateLimit(request, {
            maxRequests: 30,
            windowMs: 15 * 60 * 1000,
        });

        if (rateLimitResult.limited) {
            return rateLimitResponse(rateLimitResult.resetTime);
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            throw new UnauthorizedError();
        }

        const session = await verifyToken(token);
        const role = (session as any)?.role;

        if (!session || (role !== 'founder' && role !== 'teamlead')) {
            throw new ForbiddenError('Only Founder or Team Lead can give reviews');
        }

        // ✅ Centralized validation (using internId instead of intern)
        const { internId, period, metrics, feedback, goals } = await parseBody(request, performanceSchemas.create);

        await connectToDatabase();

        // Verify intern exists
        const intern = await User.findById(internId);
        if (!intern || intern.role !== 'intern') {
            throw new NotFoundError('Invalid intern ID');
        }

        // Check if review already exists for this period
        const existing = await Performance.findOne({
            intern: internId,
            period: period,
        });

        if (existing) {
            throw new ConflictError('Performance review already exists for this period');
        }

        const performance = await Performance.create({
            intern: internId,
            period,
            metrics,
            feedback,
            goals,
            reviewer: (session as any).id,
        });

        // ✅ Audit logging
        await audit.performanceReviewed({
            reviewerId: (session as any).id,
            reviewerName: (session as any).name,
            reviewerRole: (session as any).role,
            performanceId: performance._id.toString(),
            internId: internId,
            period: period,
            score: performance.overallScore,
            request,
        });

        // ✅ Invalidate cache
        cache.invalidateByPrefix('performance:');

        // Update user's performance score
        const allPerformances = await Performance.find({ intern: internId });
        const avgScore = Math.round(
            allPerformances.reduce((sum, p) => sum + p.overallScore, 0) / allPerformances.length
        );
        await User.findByIdAndUpdate(internId, { performanceScore: avgScore });

        const populated = await Performance.findById(performance._id)
            .populate('intern', 'name email department')
            .populate('reviewer', 'name email role');

        return NextResponse.json({ performance: populated }, { status: 201 });
    } catch (error: unknown) {
        // ✅ Centralized error handling
        return handleAPIError(error);
    }
}
