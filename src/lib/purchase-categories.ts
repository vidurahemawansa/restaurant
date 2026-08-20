export const DEFAULT_PURCHASE_CATEGORIES = [
  "Meat",
  "Seafood",
  "Vegetables",
  "Rice & Grains",
  "Sauces",
  "Spices & Seasonings",
  "Beverages",
  "Packaging",
  "Cleaning",
  "Gas",
  "Other",
] as const;

/** Map legacy category strings to new default category names */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Meat: "Meat",
  Seafood: "Seafood",
  Vegetables: "Vegetables",
  "Dry Goods": "Rice & Grains",
  Sauces: "Sauces",
  Dairy: "Other",
  Drinks: "Beverages",
  Snacks: "Other",
  Cooking: "Gas",
  Packaging: "Packaging",
  Cleaning: "Cleaning",
  Gas: "Gas",
  Other: "Other",
};

type Tx = {
  purchaseItemCategory: {
    upsert: (args: {
      where: { restaurantId_name: { restaurantId: string; name: string } };
      create: {
        restaurantId: string;
        name: string;
        sortOrder: number;
      };
      update: { sortOrder: number; active: boolean };
    }) => Promise<{ id: string; name: string; sortOrder: number }>;
  };
};

export async function seedPurchaseCategories(restaurantId: string, tx: Tx) {
  const categories = [];
  for (let i = 0; i < DEFAULT_PURCHASE_CATEGORIES.length; i++) {
    const name = DEFAULT_PURCHASE_CATEGORIES[i];
    const cat = await tx.purchaseItemCategory.upsert({
      where: { restaurantId_name: { restaurantId, name } },
      create: { restaurantId, name, sortOrder: i + 1 },
      update: { sortOrder: i + 1, active: true },
    });
    categories.push(cat);
  }
  return categories;
}

export function categoryIdFromName(
  categoryName: string,
  categories: { id: string; name: string }[]
) {
  const mapped = LEGACY_CATEGORY_MAP[categoryName] ?? categoryName;
  return (
    categories.find((c) => c.name === mapped)?.id ??
    categories.find((c) => c.name === "Other")!.id
  );
}

export async function resolveCategoryId(
  restaurantId: string,
  categoryName: string,
  tx: Tx,
  existingCategories?: { id: string; name: string }[]
) {
  const cats = existingCategories ?? (await seedPurchaseCategories(restaurantId, tx));
  return categoryIdFromName(categoryName, cats);
}
