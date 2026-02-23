import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 },
      );
    }

    const { email, password } = loginSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (user.status === "inactive") {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return NextResponse.json(
        { error: `Invalid input: ${errorMessages}` },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
