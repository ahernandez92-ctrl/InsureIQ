"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────

const carrierSchema = z.object({
  name: z.string().min(1, "Carrier name is required"),
  code: z.string().min(1, "Carrier code is required"),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  code: z.string().min(1, "Product code is required"),
  carrierId: z.string().min(1, "Carrier is required"),
  category: z.enum(["LIFE", "HEALTH", "SUPPLEMENTAL"]),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

const priceSchema = z.object({
  productId: z.string().min(1),
  state: z.string().length(2, "State must be a 2-letter code"),
  ageFrom: z.coerce.number().int().min(0).max(120),
  ageTo: z.coerce.number().int().min(0).max(120),
  tier: z.enum(["ESSENTIAL", "COMPREHENSIVE", "MAXIMUM"]),
  amount: z.coerce.number().positive("Amount must be positive"),
});

// ─── Authorization Helper ───────────────────────────────────────

async function assertAgentAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── Carrier Actions ────────────────────────────────────────────

export async function getCarriers() {
  await assertAgentAccess();
  return prisma.carrier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCarrier(id: string) {
  const agentId = await assertAgentAccess();
  const carrier = await prisma.carrier.findUnique({
    where: { id },
    include: {
      products: {
        include: { _count: { select: { prices: true } } },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!carrier) throw new Error("Carrier not found");
  return carrier;
}

export async function createCarrier(data: z.infer<typeof carrierSchema>) {
  await assertAgentAccess();
  const parsed = carrierSchema.parse(data);
  const carrier = await prisma.carrier.create({ data: parsed });
  revalidatePath("/portal/admin/carriers");
  return carrier;
}

export async function updateCarrier(
  id: string,
  data: z.infer<typeof carrierSchema>
) {
  await assertAgentAccess();
  const parsed = carrierSchema.parse(data);
  const carrier = await prisma.carrier.update({
    where: { id },
    data: parsed,
  });
  revalidatePath("/portal/admin/carriers");
  revalidatePath(`/portal/admin/carriers/${id}`);
  return carrier;
}

export async function deleteCarrier(id: string) {
  await assertAgentAccess();
  await prisma.carrier.delete({ where: { id } });
  revalidatePath("/portal/admin/carriers");
}

// ─── Product Actions ────────────────────────────────────────────

export async function getProducts(carrierId?: string) {
  await assertAgentAccess();
  return prisma.product.findMany({
    where: carrierId ? { carrierId } : {},
    include: {
      carrier: { select: { name: true, code: true } },
      _count: { select: { prices: true } },
    },
    orderBy: [{ carrier: { name: "asc" } }, { name: "asc" }],
  });
}

export async function getProduct(id: string) {
  await assertAgentAccess();
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      carrier: { select: { id: true, name: true, code: true } },
      prices: { orderBy: [{ state: "asc" }, { ageFrom: "asc" }] },
    },
  });
  if (!product) throw new Error("Product not found");
  return product;
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  await assertAgentAccess();
  const parsed = productSchema.parse(data);

  const carrier = await prisma.carrier.findUnique({
    where: { id: parsed.carrierId },
  });
  if (!carrier) throw new Error("Carrier not found");

  const product = await prisma.product.create({
    data: {
      ...parsed,
      description: parsed.description || null,
    },
  });
  revalidatePath("/portal/admin/products");
  return product;
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
) {
  await assertAgentAccess();
  const parsed = productSchema.parse(data);
  const product = await prisma.product.update({
    where: { id },
    data: { ...parsed, description: parsed.description || null },
  });
  revalidatePath("/portal/admin/products");
  revalidatePath(`/portal/admin/products/${id}`);
  return product;
}

export async function deleteProduct(id: string) {
  await assertAgentAccess();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/portal/admin/products");
}

// ─── Price Actions ──────────────────────────────────────────────

export async function getPrices(productId?: string) {
  await assertAgentAccess();
  return prisma.price.findMany({
    where: productId ? { productId } : {},
    include: {
      product: { select: { name: true, code: true, carrier: { select: { name: true } } } },
    },
    orderBy: [{ state: "asc" }, { ageFrom: "asc" }],
  });
}

export async function createPrice(data: z.infer<typeof priceSchema>) {
  await assertAgentAccess();
  const parsed = priceSchema.parse(data);
  const price = await prisma.price.create({ data: parsed });
  revalidatePath("/portal/admin/pricing");
  revalidatePath(`/portal/admin/products/${parsed.productId}`);
  return price;
}

export async function deletePrice(id: string) {
  await assertAgentAccess();
  await prisma.price.delete({ where: { id } });
  revalidatePath("/portal/admin/pricing");
}

// ─── Bulk Price Import ──────────────────────────────────────────

export async function importPrices(
  prices: Array<{
    productCode: string;
    state: string;
    ageFrom: number;
    ageTo: number;
    tier: string;
    amount: number;
  }>
) {
  await assertAgentAccess();
  let created = 0;
  let skipped = 0;

  for (const row of prices) {
    const product = await prisma.product.findUnique({
      where: { code: row.productCode },
    });
    if (!product) {
      skipped++;
      continue;
    }

    await prisma.price.create({
      data: {
        productId: product.id,
        state: row.state,
        ageFrom: row.ageFrom,
        ageTo: row.ageTo,
        tier: row.tier,
        amount: row.amount,
      },
    });
    created++;
  }

  revalidatePath("/portal/admin/pricing");
  return { created, skipped };
}