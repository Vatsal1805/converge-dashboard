import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, handleAPIError } from '@/lib/errors';
import { cache, cacheKeys, withCache } from '@/lib/cache';

export async function GET(request: Request) {
    try {
        // ✅ Rate limiting
        const rateLimitResult = await rateLimit(request, {
            maxRequests: 100,
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

        if (!session || (role !== 'founder' && role !== 'teamlead' && role !== 'intern')) {
            throw new ForbiddenError();
        }

        await connectToDatabase();

        // Support filtering by role via query params
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get('role');

        // ✅ Caching with cache key
        const cacheKey = cacheKeys.usersList(roleFilter || undefined);
        
        const users = await withCache(
            cacheKey,
            async () => {
                const query: any = {};
                if (roleFilter) {
                    // Support comma-separated roles like "intern,teamlead"
                    const roles = roleFilter.split(',').map(r => r.trim());
                    query.role = { $in: roles };
                }

                return await User.find(query)
                    .select('-password') // Exclude password
                    .sort({ createdAt: -1 })
                    .lean();
            },
            300 // Cache for 5 minutes
        );

        return NextResponse.json({ users });

    } catch (error: unknown) {
        // ✅ Centralized error handling
        return handleAPIError(error);
    }
}
