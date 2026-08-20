import { Nav } from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</div>;
  }

  let restaurantName: string | null = null;
  if (user.restaurantId) {
    const r = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { name: true },
    });
    restaurantName = r?.name ?? null;
  }

  return (
    <>
      <Nav user={user} restaurantName={restaurantName} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </>
  );
}
