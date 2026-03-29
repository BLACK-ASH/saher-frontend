"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

const fileSample = {
  "id": "69c61d7869eaed473fefb9f8",
  "fileName": "09e608b9-4c53-4d80-b57b-d946e141f59b.webp",
  "url": "http://localhost:4000/uploads/images/09e608b9-4c53-4d80-b57b-d946e141f59b.webp",
  "size": 74620,
  "width": 1024,
  "height": 576,
  "mimetype": "image/webp"
}

export type ImageFile = typeof fileSample

type ImageUploadProps = {
  onUploadSuccess?: (data: { alt: string, file: ImageFile }) => void;
  altName?:string
};

export default function ImageUpload({ onUploadSuccess,altName }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alt, setAlt] = useState(altName || "");
  const [error, setError] = useState("");

  const uploadImage = async (file: File) => {
    if (!alt.trim()) {
      setError("Alt text is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", alt); // 👈 important


      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/upload/image`,
        {
          method: "POST",
          body: formData
        }
      )

      if (response?.success) {
        onUploadSuccess?.({
          alt: alt,
          //@ts-expect-error
          file: response?.file
        });
        toast("Image Upload Successful.")
      }
    } catch (err) {
      console.error(err);
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    uploadImage(file);
  }, [alt]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-4">

      {/* ALT INPUT */}
      <div>
        <input
          type="text"
          id="alt"
          placeholder="Enter image alt text (required)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition
        ${isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"}
        hover:border-purple-400`}
      >
        <input {...getInputProps()} />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt={alt || "preview"}
              className="w-40 h-40 object-cover rounded-xl shadow"
            />
            <p className="text-sm text-gray-500">
              {loading ? "Uploading..." : "Click or drag to replace"}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "Drop the image here..." : "Drag & drop image"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select file
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
