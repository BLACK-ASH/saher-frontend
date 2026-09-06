"use client";

// Client-side resize/re-encode keeps the upload transport lean; the backend
// multer cap is set well above the compressed size (20MB), so only genuinely
// oversized raw files hit the limit. Small, already-fine files pass through
// untouched so quality is never degraded needlessly.
const MAX_DIMENSION = 1600;
const MAX_KEEP_BYTES = 1_000_000;
const QUALITY = 0.8;

const ALPHA_FORMATS = new Set(["image/png", "image/webp"]);

export async function compressImage(
  file: File,
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

  if (scale === 1 && file.size <= MAX_KEEP_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const keepAlpha = ALPHA_FORMATS.has(file.type);
  const type = keepAlpha ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
  if (!blob) return file;

  const ext = keepAlpha ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.${ext}`, { type });
}