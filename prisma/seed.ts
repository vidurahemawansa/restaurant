import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";
import bcrypt from "bcryptjs";
import { resolveCategoryId, seedPurchaseCategories } from "../src/lib/purchase-categories";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ?? "vishwanath.wgv2h@gmail.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@123";
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "owner@demo.com";
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "Demo@123";
const DEMO_EMPLOYEE_EMAIL = process.env.DEMO_EMPLOYEE_EMAIL ?? "kamal@demo.com";
const DEMO_EMPLOYEE_PASSWORD = process.env.DEMO_EMPLOYEE_PASSWORD ?? "Demo@123";

const PURCHASE_ITEMS = [
  { name: "Chicken", category: "Meat", defaultUnit: "kg", sortOrder: 1 },
  { name: "Beef", category: "Meat", defaultUnit: "kg", sortOrder: 2 },
  { name: "Fish", category: "Seafood", defaultUnit: "kg", sortOrder: 4 },
  { name: "Prawns", category: "Seafood", defaultUnit: "kg", sortOrder: 3 },
  { name: "Rice", category: "Rice & Grains", defaultUnit: "kg", sortOrder: 5 },
  { name: "Vegetables", category: "Vegetables", defaultUnit: "kg", sortOrder: 6 },
  { name: "Soya Sauce", category: "Sauces", defaultUnit: "bottle", sortOrder: 7 },
  { name: "Gas", category: "Gas", defaultUnit: "cylinder", sortOrder: 9 },
  { name: "Other", category: "Other", defaultUnit: "pcs", sortOrder: 99 },
];

const MENU_ITEMS = [
  { name: "Chicken Fried Rice", price: 650, category: "Rice", sortOrder: 1 },
  { name: "Egg Fried Rice", price: 550, category: "Rice", sortOrder: 2 },
  { name: "Chicken Kottu", price: 700, category: "Kottu", sortOrder: 4 },
  { name: "Beef Kottu", price: 800, category: "Kottu", sortOrder: 5 },
  { name: "Soft Drink", price: 150, category: "Drinks", sortOrder: 9 },
];

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  // Super Admin
  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    update: {
      name: "Super Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      passwordHash: await hash(SUPER_ADMIN_PASSWORD),
    },
    create: {
      name: "Super Admin",
      email: SUPER_ADMIN_EMAIL.toLowerCase(),
      passwordHash: await hash(SUPER_ADMIN_PASSWORD),
      role: "SUPER_ADMIN",
    },
  });

  // Demo restaurant + admin
  let restaurant = await prisma.restaurant.findFirst({ where: { name: "Demo Kitchen" } });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: "Demo Kitchen",
        address: "Colombo",
        phone: "+94 77 000 0000",
      },
    });
  }

  const demoAdmin = await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL.toLowerCase() },
    update: {
      passwordHash: await hash(DEMO_ADMIN_PASSWORD),
      role: "RESTAURANT_ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "Demo Owner",
      email: DEMO_ADMIN_EMAIL.toLowerCase(),
      passwordHash: await hash(DEMO_ADMIN_PASSWORD),
      role: "RESTAURANT_ADMIN",
    },
  });

  await prisma.restaurantMembership.upsert({
    where: {
      userId_restaurantId: { userId: demoAdmin.id, restaurantId: restaurant.id },
    },
    update: {},
    create: { userId: demoAdmin.id, restaurantId: restaurant.id },
  });

  await seedPurchaseCategories(restaurant.id, prisma);

  for (const item of PURCHASE_ITEMS) {
    const categoryId = await resolveCategoryId(restaurant.id, item.category, prisma);
    await prisma.purchaseItem.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: item.name } },
      update: {
        categoryId,
        defaultUnit: item.defaultUnit,
        sortOrder: item.sortOrder,
        active: true,
      },
      create: {
        restaurantId: restaurant.id,
        categoryId,
        name: item.name,
        defaultUnit: item.defaultUnit,
        sortOrder: item.sortOrder,
      },
    });
  }

  for (const item of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: item.name } },
      update: { price: item.price, category: item.category, sortOrder: item.sortOrder },
      create: { ...item, restaurantId: restaurant.id },
    });
  }

  // Employees
  const employeeUser = await prisma.user.upsert({
    where: { email: DEMO_EMPLOYEE_EMAIL.toLowerCase() },
    update: {
      passwordHash: await hash(DEMO_EMPLOYEE_PASSWORD),
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
    create: {
      name: "Kamal",
      email: DEMO_EMPLOYEE_EMAIL.toLowerCase(),
      passwordHash: await hash(DEMO_EMPLOYEE_PASSWORD),
      role: "EMPLOYEE",
    },
  });

  let employee = await prisma.employee.findFirst({
    where: { restaurantId: restaurant.id, name: "Kamal" },
  });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        restaurantId: restaurant.id,
        userId: employeeUser.id,
        name: "Kamal",
        position: "Cook",
        role: "Cook",
        salaryType: "MONTHLY",
        salaryAmount: 45000,
      },
    });
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: { userId: employeeUser.id, salaryType: "MONTHLY", salaryAmount: 45000 },
    });
  }

  const existingNimal = await prisma.employee.findFirst({
    where: { restaurantId: restaurant.id, name: "Nimal" },
  });
  if (!existingNimal) {
    await prisma.employee.create({
      data: {
        restaurantId: restaurant.id,
        name: "Nimal",
        position: "Helper",
        salaryType: "MONTHLY",
        salaryAmount: 35000,
      },
    });
  }

  const existingSarath = await prisma.employee.findFirst({
    where: { restaurantId: restaurant.id, name: "Sarath" },
  });
  if (!existingSarath) {
    await prisma.employee.create({
      data: {
        restaurantId: restaurant.id,
        name: "Sarath",
        position: "Kitchen helper",
        salaryType: "DAILY",
        salaryAmount: 4500,
      },
    });
  }

  // Demo transactions if empty
  const saleCount = await prisma.sale.count({ where: { restaurantId: restaurant.id } });
  if (saleCount === 0) {
    const items = await prisma.purchaseItem.findMany({ where: { restaurantId: restaurant.id } });
    const byName = Object.fromEntries(items.map((i) => [i.name, i]));
    const menus = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
    const menuByName = Object.fromEntries(menus.map((m) => [m.name, m]));

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    await prisma.purchase.create({
      data: {
        restaurantId: restaurant.id,
        date: today,
        totalAmount: 18500,
        lines: {
          create: [
            { itemId: byName.Chicken.id, amount: 8000 },
            { itemId: byName.Rice.id, amount: 3500 },
            { itemId: byName.Fish.id, amount: 5000 },
            { itemId: byName.Vegetables.id, amount: 2000 },
          ].filter((l) => l.itemId),
        },
      },
    });

    const cfr = menuByName["Chicken Fried Rice"];
    if (cfr) {
      await prisma.sale.create({
        data: {
          restaurantId: restaurant.id,
          date: today,
          totalAmount: 25 * cfr.price,
          lines: {
            create: [
              {
                menuItemId: cfr.id,
                quantity: 25,
                unitPrice: cfr.price,
                amount: 25 * cfr.price,
              },
            ],
          },
        },
      });
    }

    await prisma.salaryPayment.create({
      data: {
        restaurantId: restaurant.id,
        employeeId: employee.id,
        date: today,
        amount: 15000,
        type: "PAYMENT",
        notes: "Weekly",
      },
    });

    await prisma.salaryPayment.create({
      data: {
        restaurantId: restaurant.id,
        employeeId: employee.id,
        date: new Date(today.getFullYear(), today.getMonth(), 5, 12),
        amount: 10000,
        type: "PAYMENT",
      },
    });

    await prisma.expense.create({
      data: {
        restaurantId: restaurant.id,
        date: today,
        category: "Utilities",
        description: "Electricity",
        amount: 8500,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Super Admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
  console.log(`  Restaurant Admin: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`  Employee: ${DEMO_EMPLOYEE_EMAIL} / ${DEMO_EMPLOYEE_PASSWORD}`);
  console.log(`  Restaurant: Demo Kitchen`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
