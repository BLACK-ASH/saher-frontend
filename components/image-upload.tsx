"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

type Props = {
  altName: string;
  url?: string;
  onUploadSuccess?: (data: any) => void;
};

export default function ImageUpload({ altName, url, onUploadSuccess }: Props) {
  const [preview, setPreview] = useState<string | null>(url ?? null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(false);

  // 📦 DROP
  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setIsCropping(true);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  // 🖼️ INIT CROP
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;

    const crop = centerCrop(
      makeAspectCrop({ unit: "%", width: 50 }, 1, width, height),
      width,
      height,
    );

    setCrop(crop);
  }

  // ✂️ CROP
  function handleCrop() {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "cropped.png", {
        type: "image/png",
      });

      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setIsCropping(false);

      // 🚀 Upload
      try {
        setLoading(true);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("name", altName);

        const res = await apiFetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (res?.success) {
          // @ts-expect-error - this will be present
          onUploadSuccess?.(res.file);
          toast("Uploaded");
        }
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-6 rounded-xl text-center cursor-pointer"
      >
        <input {...getInputProps()} />

        {preview ? (
          <AspectRatio ratio={1}>
            <Image src={preview} alt="preview" fill />
          </AspectRatio>
        ) : (
          <p>Upload Image</p>
        )}
      </div>

      {/* CROPPER */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="m-2 min-w-full md:min-w-1/2 max-w-xl">
          {imageSrc && (
            <>
              <ReactCrop
                crop={crop}
                onChange={(_, c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                keepSelection
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="crop"
                  onLoad={onImageLoad}
                  className="max-h-100 object-contain"
                />
              </ReactCrop>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant={"destructive"}
                  onClick={() => setIsCropping(false)}
                >
                  Cancel
                </Button>
                <Button variant={"default"} onClick={handleCrop}>
                  Crop & Upload
                </Button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
