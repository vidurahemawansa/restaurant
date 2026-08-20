import OpenAI from "openai";
import { TOTAL_MISMATCH_TOLERANCE } from "./constants";
import { preprocessBillImage, bufferToDataUrl } from "./image";
import { buildScanItems } from "./matching";
import { buildBillExtractionPrompt } from "./prompt";
import type { AiRawBillResponse, BillScanResult, MenuRef } from "./types";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env for bill scanning."
    );
  }
  return new OpenAI({ apiKey });
}

function parseAiJson(content: string): AiRawBillResponse {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON");
  }
  return JSON.parse(jsonMatch[0]) as AiRawBillResponse;
}

export async function extractBillFromImage(
  imageBuffer: Buffer,
  menu: MenuRef[],
  clientMime?: string | null
): Promise<BillScanResult> {
  const { buffer, mimeType } = await preprocessBillImage(imageBuffer);
  const imageDataUrl = bufferToDataUrl(buffer, mimeType);
  const base64 = buffer.toString("base64");

  const openai = getOpenAIClient();
  const model = process.env.OPENAI_BILL_MODEL ?? "gpt-4o";

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildBillExtractionPrompt(menu),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all sale line items from this handwritten bill image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI vision model");
  }

  const parsed = parseAiJson(content);
  const warnings = [...(parsed.warnings ?? [])];

  const unreadable =
    parsed.unreadable === true || parsed.imageQuality === "unreadable";

  if (unreadable) {
    warnings.unshift(
      "The handwriting is unclear. Please retake the photo or review the extracted information manually."
    );
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  if (!rawItems.length && !unreadable) {
    warnings.push("No line items detected. Add items manually or retake the photo.");
  }

  const items = buildScanItems(rawItems, menu);
  const calculatedTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const discount = parsed.discount != null ? Number(parsed.discount) : 0;
  const handwrittenTotal =
    parsed.total != null && Number.isFinite(Number(parsed.total))
      ? Number(parsed.total)
      : null;

  const expectedAfterDiscount = calculatedTotal - discount;
  const totalMismatch =
    handwrittenTotal != null &&
    Math.abs(handwrittenTotal - expectedAfterDiscount) > TOTAL_MISMATCH_TOLERANCE;

  if (totalMismatch) {
    warnings.push(
      "The handwritten total doesn't match the calculated total. Please verify before saving."
    );
  }

  return {
    items,
    subtotal:
      parsed.subtotal != null && Number.isFinite(Number(parsed.subtotal))
        ? Number(parsed.subtotal)
        : null,
    discount,
    handwrittenTotal,
    calculatedTotal: expectedAfterDiscount,
    totalMismatch,
    imageQuality: parsed.imageQuality ?? (unreadable ? "unreadable" : "fair"),
    unreadable,
    warnings,
    imageDataUrl,
  };
}
