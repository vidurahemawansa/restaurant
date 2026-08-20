import type { MenuRef } from "./types";

export function buildBillExtractionPrompt(menu: MenuRef[]): string {
  const menuList = menu
    .map(
      (m) =>
        `- id: "${m.id}" | name: "${m.name}" | price: ${m.price}${m.category ? ` | category: ${m.category}` : ""}`
    )
    .join("\n");

  return `You are extracting data from a handwritten restaurant bill image for a Sri Lankan restaurant.

The bill may contain:
- Sinhala handwriting (සිංහල)
- English handwriting
- Mixed Sinhala and English on the same bill
- Arabic numerals (0-9) and occasionally Sinhala numerals
- Abbreviations and shorthand used by restaurant staff

RESTAURANT MENU (canonical names — use ONLY these ids when confident):
${menuList}

RULES:
1. Return structured JSON only. No markdown, no explanation outside JSON.
2. Do NOT invent menu items. If handwriting does not clearly match a menu item, set menuItemId to null and uncertain to true.
3. Map Sinhala/abbreviated names to the closest menu item when reasonably confident.
   Examples: චිකන් කොත්තු → Chicken Kottu, චිකන් රයිස් → Chicken Fried Rice
4. Do NOT guess missing quantities or prices. Use null and mark uncertain.
5. Ignore crossed-out lines. Do not include them.
6. If multiple items appear on one line, split into separate items when possible.
7. Merge duplicate lines for the same menu item when clearly duplicates.
8. Preserve uncertainty — lower confidence rather than guessing.
9. Use the menu's canonical English name in "name" when matched; otherwise use your best reading of the handwriting in "name".
10. unitPrice should be per-item price if visible; otherwise null.
11. quantity must be a positive integer if readable; otherwise null.
12. confidence is 0.0 to 1.0 for each item.
13. Set imageQuality to "unreadable" and unreadable:true if handwriting is too blurry to read reliably.
14. discount: amount subtracted from subtotal if visible, else 0.
15. subtotal and total: only if clearly written; do not calculate unless explicitly shown.

Respond with this JSON shape:
{
  "items": [
    {
      "rawText": "exact handwriting reading",
      "name": "canonical menu name or best reading",
      "menuItemId": "id from menu list or null",
      "quantity": number or null,
      "unitPrice": number or null,
      "confidence": 0.0 to 1.0,
      "uncertain": boolean,
      "notes": "optional note about ambiguity"
    }
  ],
  "subtotal": number or null,
  "discount": number,
  "total": number or null,
  "imageQuality": "good" | "fair" | "poor" | "unreadable",
  "unreadable": boolean,
  "warnings": ["string"]
}`;
}
