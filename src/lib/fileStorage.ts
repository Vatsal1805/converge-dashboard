/**
 * File Storage Utility - Cloudinary Only
 * Optimized for small teams with simple upload needs
 *
 * FREE Tier: 25GB storage + 25GB bandwidth/month
 * Perfect for 30 users!
 */

// Install: npm install cloudinary

export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

// Allowed file types for project documents
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check if file size is 0
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Check mime type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed",
    };
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error:
        "Invalid file extension. Only .pdf, .doc, .docx, .xls, .xlsx, and .txt files are allowed",
    };
  }

  return { valid: true };
}

/**
 * Generate a safe filename
 */
export function generateSafeFilename(
  originalName: string,
  userId: string,
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.substring(originalName.lastIndexOf("."));
  const safeName = originalName
    .substring(0, originalName.lastIndexOf("."))
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50);

  return `project-docs/${userId}/${timestamp}-${randomString}-${safeName}${extension}`;
}

// ==========================================
// CLOUDINARY STORAGE
// ==========================================

/**
 * Upload file to Cloudinary
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * FREE TIER: 25GB storage + 25GB bandwidth/month (perfect for small teams!)
 * No credit card required for free tier
 */
export async function uploadToCloudinary(
  file: Buffer,
  filename: string,
  mimeType: string,
  userId: string,
): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}> {
  try {
    // Check if Cloudinary credentials are configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return {
        success: false,
        error:
          "Cloudinary credentials not configured. Please check environment variables.",
      };
    }

    // Dynamic import to avoid errors if package is not installed
    const cloudinary = await import("cloudinary");

    // Configure Cloudinary
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Determine resource type based on mime type
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";

    // Convert buffer to base64 for upload
    const base64File = `data:${mimeType};base64,${file.toString("base64")}`;

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.v2.uploader.upload(
        base64File,
        {
          resource_type: resourceType,
          folder: `project-docs/${userId}`,
          public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload to Cloudinary",
    };
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" = "raw",
): Promise<{ success: boolean; error?: string }> {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return { success: false, error: "Cloudinary credentials not configured" };
    }

    const cloudinary = await import("cloudinary");

    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await new Promise<void>((resolve, reject) => {
      cloudinary.v2.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete from Cloudinary",
    };
  }
}

/**
 * Generate optimized Cloudinary URL with transformations
 * (Optional: resize, compress, format conversion)
 */
export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  },
): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";

  const transformations = [];
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);

  const transformStr =
    transformations.length > 0 ? `/${transformations.join(",")}` : "";

  return `https://res.cloudinary.com/${cloudName}/raw/upload${transformStr}/${publicId}`;
}

/**
 * Main upload function - uses Cloudinary
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string,
  userId: string,
): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}> {
  // Check if Cloudinary is configured
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return {
      success: false,
      error:
        "Cloudinary credentials not configured. Please check environment variables.",
    };
  }

  // Upload to Cloudinary
  return uploadToCloudinary(file, filename, mimeType, userId);
}
