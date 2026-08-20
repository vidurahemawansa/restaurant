import sharp from "sharp";
import {
  ALLOWED_BILL_IMAGE_TYPES,
  MAX_BILL_IMAGE_BYTES,
  MAX_BILL_IMAGE_DIMENSION,
  type AllowedBillImageType,
} from "./constants";

export class BillImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillImageError";
  }
}

function detectMime(buffer: Buffer): AllowedBillImageType | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function validateBillImageBuffer(buffer: Buffer, clientMime?: string | null) {
  if (!buffer.length) {
    throw new BillImageError("Empty image file");
  }

  if (buffer.length > MAX_BILL_IMAGE_BYTES) {
    throw new BillImageError(
      `Image too large. Maximum size is ${Math.round(MAX_BILL_IMAGE_BYTES / (1024 * 1024))} MB`
    );
  }

  const detected = detectMime(buffer);
  if (!detected) {
    throw new BillImageError("Unsupported image format. Use JPEG, PNG, or WebP.");
  }

  if (clientMime && !ALLOWED_BILL_IMAGE_TYPES.includes(clientMime as AllowedBillImageType)) {
    throw new BillImageError("Unsupported image format. Use JPEG, PNG, or WebP.");
  }

  return detected;
}

export async function preprocessBillImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  mimeType: AllowedBillImageType;
  width: number;
  height: number;
}> {
  const mimeType = validateBillImageBuffer(buffer);

  let pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width > MAX_BILL_IMAGE_DIMENSION || height > MAX_BILL_IMAGE_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_BILL_IMAGE_DIMENSION,
      height: MAX_BILL_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output = await pipeline
    .normalize()
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  const outMeta = await sharp(output).metadata();

  return {
    buffer: output,
    mimeType: "image/jpeg",
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
  };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
