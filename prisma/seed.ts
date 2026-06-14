import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding InsureIQ database...");

  // ─── Create demo agent ──────────────────────────────────
  const passwordHash = await hash("password123", 12);
  const agent = await prisma.user.upsert({
    where: { email: "demo@insureiq.com" },
    update: {},
    create: {
      name: "Demo Agent",
      email: "demo@insureiq.com",
      passwordHash,
      role: "AGENT",
      npn: "NPN123456",
      state: "CA",
    },
  });
  console.log(`  ✓ Agent: ${agent.email}`);

  // ─── Create sample carriers ─────────────────────────────
  const mutualOfOmaha = await prisma.carrier.upsert({
    where: { code: "MUTUAL_OF_OMAHA" },
    update: {},
    create: {
      name: "Mutual of Omaha",
      code: "MUTUAL_OF_OMAHA",
      isActive: true,
    },
  });

  const aetna = await prisma.carrier.upsert({
    where: { code: "AETNA" },
    update: {},
    create: {
      name: "Aetna",
      code: "AETNA",
      isActive: true,
    },
  });

  const cigna = await prisma.carrier.upsert({
    where: { code: "CIGNA" },
    update: {},
    create: {
      name: "Cigna",
      code: "CIGNA",
      isActive: true,
    },
  });

  console.log(`  ✓ Carriers: ${mutualOfOmaha.name}, ${aetna.name}, ${cigna.name}`);

  // ─── Connect carriers to agent ──────────────────────────
  await prisma.user.update({
    where: { id: agent.id },
    data: {
      carriers: {
        connect: [
          { id: mutualOfOmaha.id },
          { id: aetna.id },
          { id: cigna.id },
        ],
      },
    },
  });

  // ─── Create sample products ─────────────────────────────
  const termLife = await prisma.product.upsert({
    where: { code: "MUTUAL_OF_OMAHA_TERM_LIFE" },
    update: {},
    create: {
      carrierId: mutualOfOmaha.id,
      name: "Term Life 20",
      code: "MUTUAL_OF_OMAHA_TERM_LIFE",
      category: "LIFE",
      description: "20-year term life insurance with guaranteed level premiums",
      isActive: true,
    },
  });

  const ci = await prisma.product.upsert({
    where: { code: "MUTUAL_OF_OMAHA_CI" },
    update: {},
    create: {
      carrierId: mutualOfOmaha.id,
      name: "Critical Illness",
      code: "MUTUAL_OF_OMAHA_CI",
      category: "SUPPLEMENTAL",
      description: "Lump-sum payment upon diagnosis of covered critical illness",
      isActive: true,
    },
  });

  const aetnaAccident = await prisma.product.upsert({
    where: { code: "AETNA_ACCIDENT" },
    update: {},
    create: {
      carrierId: aetna.id,
      name: "Accident Insurance",
      code: "AETNA_ACCIDENT",
      category: "SUPPLEMENTAL",
      description: "Coverage for accidental injuries and related medical expenses",
      isActive: true,
    },
  });

  const cignaHealth = await prisma.product.upsert({
    where: { code: "CIGNA_HEALTH_PPO" },
    update: {},
    create: {
      carrierId: cigna.id,
      name: "Health PPO Plan",
      code: "CIGNA_HEALTH_PPO",
      category: "HEALTH",
      description: "Comprehensive PPO health insurance plan",
      isActive: true,
    },
  });

  console.log(`  ✓ Products: ${termLife.name}, ${ci.name}, ${aetnaAccident.name}, ${cignaHealth.name}`);

  // ─── Connect products to agent ──────────────────────────
  await prisma.user.update({
    where: { id: agent.id },
    data: {
      products: {
        connect: [
          { id: termLife.id },
          { id: ci.id },
          { id: aetnaAccident.id },
          { id: cignaHealth.id },
        ],
      },
    },
  });

  // ─── Create sample pricing ──────────────────────────────
  const states = ["CA", "TX", "NY", "FL", "IL"];
  const pricingData = [];

  for (const state of states) {
    // Term Life pricing
    pricingData.push(
      { productId: termLife.id, state, ageFrom: 18, ageTo: 35, tier: "ESSENTIAL", amount: 25.00 },
      { productId: termLife.id, state, ageFrom: 18, ageTo: 35, tier: "COMPREHENSIVE", amount: 45.00 },
      { productId: termLife.id, state, ageFrom: 18, ageTo: 35, tier: "MAXIMUM", amount: 75.00 },
      { productId: termLife.id, state, ageFrom: 36, ageTo: 50, tier: "ESSENTIAL", amount: 45.00 },
      { productId: termLife.id, state, ageFrom: 36, ageTo: 50, tier: "COMPREHENSIVE", amount: 85.00 },
      { productId: termLife.id, state, ageFrom: 36, ageTo: 50, tier: "MAXIMUM", amount: 140.00 },
      // Critical Illness pricing
      { productId: ci.id, state, ageFrom: 18, ageTo: 49, tier: "ESSENTIAL", amount: 19.99 },
      { productId: ci.id, state, ageFrom: 18, ageTo: 49, tier: "COMPREHENSIVE", amount: 39.99 },
      { productId: ci.id, state, ageFrom: 18, ageTo: 49, tier: "MAXIMUM", amount: 69.99 },
      { productId: ci.id, state, ageFrom: 50, ageTo: 65, tier: "ESSENTIAL", amount: 39.99 },
      { productId: ci.id, state, ageFrom: 50, ageTo: 65, tier: "COMPREHENSIVE", amount: 69.99 },
      { productId: ci.id, state, ageFrom: 50, ageTo: 65, tier: "MAXIMUM", amount: 119.99 },
      // Accident Insurance pricing
      { productId: aetnaAccident.id, state, ageFrom: 18, ageTo: 64, tier: "ESSENTIAL", amount: 14.99 },
      { productId: aetnaAccident.id, state, ageFrom: 18, ageTo: 64, tier: "COMPREHENSIVE", amount: 29.99 },
      { productId: aetnaAccident.id, state, ageFrom: 18, ageTo: 64, tier: "MAXIMUM", amount: 49.99 },
    );
  }

  let priceCount = 0;
  for (const data of pricingData) {
    await prisma.price.create({ data });
    priceCount++;
  }
  console.log(`  ✓ Pricing: ${priceCount} price entries created`);

  console.log("\nSeed complete! Demo credentials: demo@insureiq.com / password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });