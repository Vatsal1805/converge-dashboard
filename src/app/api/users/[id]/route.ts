import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/jwt";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { ConflictError, NotFoundError, handleAPIError } from '@/lib/errors';
import { audit } from '@/lib/audit';
import { cache } from '@/lib/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 30,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetTime);
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      email,
      role,
      department,
      status,
      password,
      phone,
      linkedin,
      github,
      timezone,
      profileCompleted,
    } = body;

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (profileCompleted !== undefined)
      updateData.profileCompleted = profileCompleted;

    // Hash password if provided
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // ✅ Audit logging
    const currentUser = await getUserFromRequest(request);
    if (currentUser) {
      await audit.userUpdated({
        updaterId: currentUser.id?.toString() || '',
        updaterName: currentUser.name || '',
        updaterRole: currentUser.role as any,
        userId: id,
        changes: updateData,
        request,
      });
    }

    // ✅ Invalidate cache
    cache.invalidate(`user:${id}`);
    cache.invalidateByPrefix('users:list:');

    // Check if the user is updating their own profile
    const isUpdatingSelf =
      currentUser && currentUser.id?.toString() === id?.toString();

    // If user is updating their own profile, generate a new token with updated data
    if (isUpdatingSelf) {
      const newToken = await signToken({
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

      const response = NextResponse.json({ user });

      response.cookies.set("auth_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 },
    );
  }
}
