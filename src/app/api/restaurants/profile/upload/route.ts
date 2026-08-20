import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { deletePublicUpload, saveRestaurantImage } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const url = await saveRestaurantImage(restaurantId, file);

    if (kind === "logo") {
      const existing = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { logoUrl: true },
      });
      if (existing?.logoUrl) {
        await deletePublicUpload(existing.logoUrl);
      }
      const restaurant = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { logoUrl: url },
        include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
      });
      return NextResponse.json({ url, restaurant });
    }

    const count = await prisma.restaurantPhoto.count({ where: { restaurantId } });
    const photo = await prisma.restaurantPhoto.create({
      data: {
        restaurantId,
        url,
        caption: form.get("caption")?.toString().trim() || null,
        sortOrder: count,
      },
    });

    return NextResponse.json({ photo, url }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
