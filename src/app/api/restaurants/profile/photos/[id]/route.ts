import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authErrorResponse, requireRestaurantAdmin } from "@/lib/auth";
import { deletePublicUpload } from "@/lib/uploads";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { restaurantId } = await requireRestaurantAdmin();
    const { id } = await params;

    const photo = await prisma.restaurantPhoto.findFirst({
      where: { id, restaurantId },
    });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await deletePublicUpload(photo.url);
    await prisma.restaurantPhoto.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
