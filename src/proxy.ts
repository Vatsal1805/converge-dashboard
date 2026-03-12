import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Define public routes
const publicRoutes = ["/login", "/public"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass for static files and public api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/manifest")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  let user: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload;
    } catch {
      // Invalid token — clear it for non-API routes
      if (!pathname.startsWith("/api/")) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("auth_token");
        return response;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 1. Redirect to login if accessing protected route without auth
  const isProtectedRoute =
    !publicRoutes.includes(pathname) && !pathname.startsWith("/api/auth");

  if (!user && isProtectedRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect logged-in users away from login page
  if (user && pathname === "/login") {
    const role = user.role;
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  // 3. Redirect root to appropriate dashboard
  if (
    user &&
    (pathname === "/" ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/")
  ) {
    return NextResponse.redirect(
      new URL(`/dashboard/${user.role}`, request.url),
    );
  }

  // 4. Role-Based Access Control for /dashboard/:role
  if (user && pathname.startsWith("/dashboard/")) {
    const role = user.role;
    const dashboardRole = pathname.split("/")[2];

    if (
      ["founder", "teamlead", "intern"].includes(dashboardRole) &&
      dashboardRole !== role
    ) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  // Performance Optimization: Pass decoded user data to API routes via headers
  // to avoid redundant JWT verification in downstream routes.
  const requestHeaders = new Headers(request.headers);
  if (user) {
    const userData = JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      phone: user.phone,
      linkedin: user.linkedin,
      github: user.github,
      timezone: user.timezone,
      profileCompleted: user.profileCompleted,
    });
    requestHeaders.set("x-user-data", btoa(userData));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
};
