import { MAX_IMAGE_DIMENSION } from "./storage";

export interface PreparedImage {
  blob: Blob;
  fileName: string;
}

// Drawing to a canvas drops EXIF/GPS before the photo leaves the device and keeps uploads under host body limits.
export async function prepareImage(file: File): Promise<PreparedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { blob: file, fileName: file.name };
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return { blob: file, fileName: file.name };
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) return { blob: file, fileName: file.name };

  return { blob, fileName: `${file.name.replace(/\.[^.]+$/, "") || "cat"}.jpg` };
}
