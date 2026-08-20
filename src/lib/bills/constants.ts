/** Items at or above this score are treated as high confidence */
export const CONFIDENCE_HIGH = 0.75;

/** Handwritten total vs calculated total tolerance (LKR) before warning */
export const TOTAL_MISMATCH_TOLERANCE = 50;

export const MAX_BILL_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const MAX_BILL_IMAGE_DIMENSION = 2048;

export const ALLOWED_BILL_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedBillImageType = (typeof ALLOWED_BILL_IMAGE_TYPES)[number];
