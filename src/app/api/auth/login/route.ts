import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { UnauthorizedError, ForbiddenError, handleAPIError, ValidationError } from "@/lib/errors";
import { userSchemas, parseBody } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // ✅ Rate limiting: Prevent brute force attacks
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 5, // Only 5 login attempts
      windowMs: 15 * 60 * 1000, // per 15 minutes
    });

    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetTime);
    }

    // ✅ Centralized validation
    const { email, password } = await parseBody(request, userSchemas.login);

    await connectToDatabase();

    const user = await User.findOne({ email });

    // ✅ Better error handling
    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.status === "inactive") {
      throw new ForbiddenError("Account is inactive");
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate token first to reduce perceived latency
    const tokenPromise = signToken({
      id: user._id.toString(),
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

    // Update last login (non-blocking for token generation)
    user.lastLogin = new Date();
    const savePromise = user.save();

    const [token] = await Promise.all([tokenPromise, savePromise]);

    const response = NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        linkedin: user.linkedin,
        github: user.github,
        timezone: user.timezone,
        profileCompleted: user.profileCompleted,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    // ✅ Centralized error handling
    return handleAPIError(error);
  }
}
