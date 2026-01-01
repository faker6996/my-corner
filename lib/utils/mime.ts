export enum MIME_TYPE {
  JPEG = "image/jpeg",
  PNG = "image/png",
  WEBP = "image/webp",
  GIF = "image/gif",
  BMP = "image/bmp",
  SVG = "image/svg+xml",
  OCTET_STREAM = "application/octet-stream",
}

const EXTENSION_MIME_MAP: Record<string, MIME_TYPE> = {
  jpg: MIME_TYPE.JPEG,
  jpeg: MIME_TYPE.JPEG,
  png: MIME_TYPE.PNG,
  webp: MIME_TYPE.WEBP,
  gif: MIME_TYPE.GIF,
  bmp: MIME_TYPE.BMP,
  svg: MIME_TYPE.SVG,
};

export function guessMimeFromFilename(filename?: string | null): MIME_TYPE {
  const ext = (filename || "").toLowerCase().split(".").pop() || "";
  return EXTENSION_MIME_MAP[ext] ?? MIME_TYPE.OCTET_STREAM;
}

