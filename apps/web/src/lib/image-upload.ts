export const MAX_IMAGE_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB before client-side optimization

const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MAX_ENCODED_DATA_URI_LENGTH = 180_000;

/**
 * Validates whether a string is a displayable image URL or safe raster base64 data URI.
 */
export function isDisplayableImageSrc(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return true;
  return /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i.test(trimmed);
}

/**
 * Validates size/type, center-crops to a square, and encodes as an optimized WebP/JPEG data URI.
 */
export async function processUploadedImageFile(
  file: File,
  targetSizePx = 256,
): Promise<string> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new Error("INVALID_TYPE");
  }
  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new Error("TOO_LARGE");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("LOAD_FAILED"));
      el.src = objectUrl;
    });

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const side = Math.min(naturalW, naturalH);
    if (!side) {
      throw new Error("LOAD_FAILED");
    }

    const sx = Math.floor((naturalW - side) / 2);
    const sy = Math.floor((naturalH - side) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = targetSizePx;
    canvas.height = targetSizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("CANVAS_UNAVAILABLE");
    }

    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSizePx, targetSizePx);

    let dataUrl = canvas.toDataURL("image/webp", 0.85);
    if (
      !dataUrl.startsWith("data:image/webp") ||
      dataUrl.length > MAX_ENCODED_DATA_URI_LENGTH
    ) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

