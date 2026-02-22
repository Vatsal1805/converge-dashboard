import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Define public routes
const publicRoutes = ['/login', '/public'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Bypass for static files and api routes that are public (like login)
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/logout')
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;
    let user = null;

    if (token) {
        user = await verifyToken(token);
    }

    // 1. Redirect to login if accessing protected route without auth
    const isProtectedRoute = !publicRoutes.includes(pathname) && !pathname.startsWith('/api/auth');

    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Redirect logged-in users away from login page
    if (user && pathname === '/login') {
        const role = (user as any).role;
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    // 3. Role-Based Access Control logic for /dashboard/:role
    if (user && pathname.startsWith('/dashboard')) {
        const role = (user as any).role; // 'founder' | 'teamlead' | 'intern'

        // Founder has access to everything, but typically stays in /dashboard/founder
        // If a teamlead tries /dashboard/founder -> Redirect
        if (role === 'teamlead' && pathname.startsWith('/dashboard/founder')) {
            return NextResponse.redirect(new URL('/dashboard/teamlead', request.url));
        }
        if (role === 'intern' && !pathname.startsWith('/dashboard/intern')) {
            return NextResponse.redirect(new URL('/dashboard/intern', request.url));
        }
    }

    // Performance Optimization: Pass user data to API routes via headers
    // to avoid redundant JWT verification in API routes.
    const response = NextResponse.next();
    if (user) {
        // We use base64 encoding to ensure the JSON string is safe for header values
        const userData = Buffer.from(JSON.stringify(user)).toString('base64');
        response.headers.set('x-user-data', userData);
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/api/:path*'],
};
