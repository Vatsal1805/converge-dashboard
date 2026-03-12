import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  validateFile,
  generateSafeFilename,
  uploadFile,
} from "@/lib/fileStorage";
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  handleAPIError,
} from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const session = await verifyToken(token || "");

    if (!session) {
      throw new UnauthorizedError("Authentication required");
    }

    // Only founders can upload project documents
    if ((session as any).role !== "founder") {
      throw new ForbiddenError("Only founders can upload project documents");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ValidationError("No file provided");
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new ValidationError(validation.error || "Invalid file");
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe filename
    const userId = (session as any).id || (session as any).userId;
    const safeFilename = generateSafeFilename(file.name, userId);

    // Upload to configured storage (Cloudinary or AWS S3)
    const uploadResult = await uploadFile(
      buffer,
      safeFilename,
      file.type,
      userId,
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload file");
    }

    // Return file metadata
    const fileMetadata = {
      filename: safeFilename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      url: uploadResult.url,
      publicId: uploadResult.publicId, // For Cloudinary (optional)
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
    };

    return NextResponse.json({
      success: true,
      file: fileMetadata,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
