import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchPlans,
  getSystemApiKey,
  getSampleQuoteRequest,
  planToProductCode,
} from "@/lib/health-sherpa";

/**
 * POST /api/health-sherpa/sync
 * Fetch ACA plans from HealthSherpa and sync them into local Carrier/Product records.
 *
 * This is the main data onboarding flow — it:
 * 1. Queries HealthSherpa for plans in a target state
 * 2. Creates/updates Carrier records for each unique carrier
 * 3. Creates/updates Product records for each plan
 * 4. Connects all records to the requesting agent
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetState = body.state || "CA";
    const targetZip = body.zip_code || "90210";

    // Find the API key to use
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, healthSherpaApiKey: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const apiKey = user.healthSherpaApiKey || getSystemApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          message:
            "No HealthSherpa API key configured. Set HEALTHSHERPA_API_KEY in .env or add your key in Settings.",
        },
        { status: 400 }
      );
    }

    // Step 1: Fetch plans from HealthSherpa
    const quoteRequest = { ...getSampleQuoteRequest(targetState), zip_code: targetZip };
    const config = { apiKey, sandbox: process.env.NODE_ENV === "development" };
    const quoteResponse = await fetchPlans(config, quoteRequest);

    if (!quoteResponse.plans || quoteResponse.plans.length === 0) {
      return NextResponse.json(
        { message: `No plans found for ${targetState}`, plans: 0 },
        { status: 200 }
      );
    }

    // Step 2: Sync carriers and products
    let carriersCreated = 0;
    let carriersUpdated = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    const processedCarriers = new Set<string>();

    for (const plan of quoteResponse.plans) {
      // Create a carrier code from HealthSherpa carrier_id
      const carrierCode = (plan.carrier_id || plan.carrier)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_");

      if (!carrierCode || processedCarriers.has(carrierCode)) continue;
      processedCarriers.add(carrierCode);

      // Upsert Carrier
      const carrier = await prisma.carrier.upsert({
        where: { code: carrierCode },
        update: { name: plan.carrier, isActive: plan.is_active !== false },
        create: {
          name: plan.carrier,
          code: carrierCode,
          isActive: plan.is_active !== false,
        },
      });

      const isNew =
        carrier.createdAt.getTime() === carrier.updatedAt.getTime();
      if (isNew) carriersCreated++;
      else carriersUpdated++;

      // Connect carrier to agent
      await prisma.user.update({
        where: { id: user.id },
        data: { carriers: { connect: { id: carrier.id } } },
      });
    }

    // Step 3: Sync products for each plan
    for (const plan of quoteResponse.plans) {
      const carrierCode = (plan.carrier_id || plan.carrier)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_");
      const productCode = planToProductCode(plan);

      const carrier = await prisma.carrier.findUnique({
        where: { code: carrierCode },
      });
      if (!carrier) continue;

      // Upsert Product
      const product = await prisma.product.upsert({
        where: { code: productCode },
        update: {
          name: plan.name,
          category: "HEALTH",
          isActive: plan.is_active !== false,
        },
        create: {
          carrierId: carrier.id,
          name: plan.name,
          code: productCode,
          category: "HEALTH",
          isActive: plan.is_active !== false,
          description: `${plan.plan_type} plan - ${plan.metal_level} tier via ${plan.network} network`,
        },
      });

      const isNew =
        product.createdAt.getTime() === product.updatedAt.getTime();
      if (isNew) productsCreated++;
      else productsUpdated++;

      // Connect product to agent
      await prisma.user.update({
        where: { id: user.id },
        data: { products: { connect: { id: product.id } } },
      });
    }

    return NextResponse.json({
      message: `Sync complete for ${targetState}`,
      stats: {
        carriersCreated,
        carriersUpdated,
        productsCreated,
        productsUpdated,
        totalPlans: quoteResponse.plans.length,
        lowestPremium: quoteResponse.lowest_premium,
        highestPremium: quoteResponse.highest_premium,
      },
    });
  } catch (error) {
    console.error("HealthSherpa sync error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health-sherpa/sync
 * Check sync status — verify API key connectivity and show available states
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getSystemApiKey();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { healthSherpaApiKey: true },
  });

  return NextResponse.json({
    systemKeyConfigured: !!apiKey,
    agentKeyConfigured: !!user?.healthSherpaApiKey,
    available: !!(apiKey || user?.healthSherpaApiKey),
  });
}