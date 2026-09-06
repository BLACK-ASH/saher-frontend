"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-wrapper";
import { compressImage } from "@/lib/compress-image";
import { toast } from "sonner";
import { UploadCloud, X } from "lucide-react";

// Matches ../saher-backend uploadBulkImagesController response envelope data
type UploadedImage = {
  id: string;
  fileName: string;
  alt: string;
  src: string;
  size: number;
  mimetype: string;
};

type Props = {
  onUploadSuccess?: (images: UploadedImage[]) => void;
  maxFiles?: number;
};

export default function BulkImageUpload({
  onUploadSuccess,
  maxFiles = 50,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const previewCache = useRef<string[]>([]);

  const reset = useCallback(() => {
    setFiles([]);
    setPreviews([]);
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const pick = accepted.slice(0, maxFiles);
      setFiles(pick);
      setPreviews(
        (prev) => {
          // free old object URLs, then store new ones
          previewCache.current.forEach(URL.revokeObjectURL);
          previewCache.current = pick.map((f) => URL.createObjectURL(f));
          return previewCache.current;
        },
      );
    },
    [maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxFiles,
  });

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("images", await compressImage(file));
      }

      const res = await apiFetch<UploadedImage[]>("/api/upload/images", {
        method: "POST",
        body: formData,
      });

      if (res?.success) {
        onUploadSuccess?.(res.data);
        toast.success(`${res.data.length} image${res.data.length > 1 ? "s" : ""} uploaded.`);
        reset();
      }
    } catch (err) {
      // apiFetch already toasts the server's message for envelope errors; only
      // add a hint when a proxy-level rejection (413/html) left the user blind.
      const msg = err instanceof Error ? err.message : "";
      if (msg === "Invalid server response") {
        toast.error(
          "Upload failed — images may be too large or unsupported. Try fewer or smaller files.",
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-6 rounded-xl text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? "Drop images here…"
            : `Click or drop up to ${maxFiles} images`}
        </p>
      </div>

      {/* PREVIEWS */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
              <Image src={src} alt={`preview-${i}`} fill className="object-cover" />
              {!uploading && (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                  onClick={() => {
                    const next = files.filter((_, idx) => idx !== i);
                    const url = previewCache.current[i];
                    if (url) URL.revokeObjectURL(url);
                    previewCache.current = previewCache.current.filter((_, idx) => idx !== i);
                    setFiles(next);
                    setPreviews(previewCache.current);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={reset} disabled={uploading}>
            Clear
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading…" : `Upload ${files.length} image${files.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}