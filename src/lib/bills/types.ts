export type AiRawBillItem = {
  rawText?: string;
  name: string;
  menuItemId?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  confidence?: number;
  uncertain?: boolean;
  notes?: string;
};

export type AiRawBillResponse = {
  items?: AiRawBillItem[];
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
  imageQuality?: "good" | "fair" | "poor" | "unreadable";
  unreadable?: boolean;
  warnings?: string[];
};

export type BillScanItem = {
  id: string;
  rawText: string;
  name: string;
  menuItemId: string | null;
  menuItemName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  confidence: number;
  needsReview: boolean;
  reviewReasons: string[];
};

export type BillScanResult = {
  items: BillScanItem[];
  subtotal: number | null;
  discount: number;
  handwrittenTotal: number | null;
  calculatedTotal: number;
  totalMismatch: boolean;
  imageQuality: "good" | "fair" | "poor" | "unreadable";
  unreadable: boolean;
  warnings: string[];
  imageDataUrl: string;
};

export type MenuRef = {
  id: string;
  name: string;
  price: number;
  category: string | null;
};
