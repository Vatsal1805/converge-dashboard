/**
 * File Utilities
 * Shared utilities for file validation, upload, and download operations
 */

// Allowed file types for project documents
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// Max file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Human-readable file types
export const FILE_TYPE_LABELS = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "text/plain": "TXT",
};

/**
 * Validate file type and size
 * @param file - File to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error:
        "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "File size exceeds maximum limit of 50MB",
    };
  }

  return { isValid: true };
}

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Download a file from URL with original filename
 * @param url - File URL
 * @param originalName - Original filename to use for download
 * @returns Promise that resolves when download completes
 */
export async function downloadFile(
  url: string,
  originalName: string,
): Promise<void> {
  try {
    // Method 1: Try fetch + blob for proper filename (works with CORS)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Fetch failed");
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const link = document.createElement("a");
    link.href = url;
    link.download = originalName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Upload file to server
 * @param file - File to upload
 * @param endpoint - API endpoint (default: /api/projects/upload-document)
 * @returns Promise with uploaded file metadata
 */
export async function uploadFile(
  file: File,
  endpoint: string = "/api/projects/upload-document",
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "File upload failed");
  }

  return response.json();
}

/**
 * Get file extension from filename
 * @param filename - Filename
 * @returns Extension (e.g., "pdf", "docx")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Get file type label from MIME type
 * @param mimeType - MIME type
 * @returns Human-readable label (e.g., "PDF", "DOCX")
 */
export function getFileTypeLabel(mimeType: string): string {
  return (
    FILE_TYPE_LABELS[mimeType as keyof typeof FILE_TYPE_LABELS] || "Unknown"
  );
}
