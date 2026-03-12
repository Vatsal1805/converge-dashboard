/**
 * Reusable File Upload Section Component
 * Supports drag-and-drop, file validation, and file preview
 */

"use client";

import { useState, useRef } from "react";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateFile, formatFileSize } from "@/lib/fileUtils";

interface FileUploadSectionProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
  onErrorChange?: (error: string) => void;
  disabled?: boolean;
  label?: string;
  helpText?: string;
}

export function FileUploadSection({
  selectedFile,
  onFileSelect,
  error,
  onErrorChange,
  disabled = false,
  label = "Project Document",
  helpText = "Click or drag and drop to upload (PDF, DOC, DOCX, XLS, XLSX, TXT - Max 50MB)",
}: FileUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (file: File | null) => {
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      if (onErrorChange) onErrorChange(validation.error || "");
      return;
    }

    if (onErrorChange) onErrorChange("");
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileInput(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      handleFileInput(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* File selected preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-green-600">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRemove}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload area */}
      {!selectedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg
            cursor-pointer transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleChange}
            disabled={disabled}
          />
          <Upload className="h-6 w-6 text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              {dragActive ? "Drop file here" : "Choose file or drag & drop"}
            </p>
            {helpText && (
              <p className="text-xs text-slate-500 mt-1">{helpText}</p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
