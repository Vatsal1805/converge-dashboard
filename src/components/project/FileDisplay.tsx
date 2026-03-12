/**
 * Reusable File Display Component
 * Displays file information with download and remove options
 */

"use client";

import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFile, formatFileSize } from "@/lib/fileUtils";

export interface FileDocument {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  publicId?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FileDisplayProps {
  document: FileDocument;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function FileDisplay({
  document,
  onRemove,
  showRemove = false,
  className = "",
  variant = "default",
}: FileDisplayProps) {
  const handleDownload = async () => {
    try {
      await downloadFile(document.url, document.originalName);
    } catch (error) {
      alert("Failed to download file");
    }
  };

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 p-2 border rounded-lg bg-slate-50 ${className}`}
      >
        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {document.originalName}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-7 px-2"
        >
          <Download className="h-3 w-3" />
        </Button>
        {showRemove && onRemove && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg bg-slate-50 ${className}`}
    >
      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{document.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(document.size)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="text-black hover:text-black"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        {showRemove && onRemove && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
