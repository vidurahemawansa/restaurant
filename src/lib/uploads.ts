import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "restaurants");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function restaurantUploadDir(restaurantId: string) {
  return path.join(UPLOAD_ROOT, restaurantId);
}

export function publicUploadUrl(restaurantId: string, filename: string) {
  return `/uploads/restaurants/${restaurantId}/${filename}`;
}

export async function saveRestaurantImage(
  restaurantId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP or GIF images are allowed");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/gif"
          ? ".gif"
          : ".jpg";

  const dir = restaurantUploadDir(restaurantId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return publicUploadUrl(restaurantId, filename);
}

export async function deletePublicUpload(url: string) {
  if (!url.startsWith("/uploads/restaurants/")) return;
  const rel = url.replace(/^\//, "");
  const full = path.join(process.cwd(), "public", rel);
  await unlink(full).catch(() => {});
}
