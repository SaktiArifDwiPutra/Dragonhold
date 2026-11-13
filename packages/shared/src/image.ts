export const MAX_IMAGE_DATA_URI_LENGTH = 200_000;
export const MAX_IMAGE_URL_LENGTH = 512;

export const SAFE_HTTP_IMAGE_URL_RE = /^https?:\/\/[^\s]+$/i;
export const SAFE_DATA_IMAGE_RE =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+=*$/i;

/**
 * Checks whether a value is a bounded, safe base64 raster data URI (rejects SVG/HTML).
 */
export function isSafeRasterDataUri(value: string): boolean {
  return (
    value.length <= MAX_IMAGE_DATA_URI_LENGTH && SAFE_DATA_IMAGE_RE.test(value)
  );
}

