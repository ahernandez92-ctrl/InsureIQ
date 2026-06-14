import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPlans, getBestApiConfig, getSystemApiKey, getSampleQuoteRequest } from "@/lib/health-sherpa";

/**
 * POST /api/health-sherpa/quote
 * Fetch plans from HealthSherpa
 *
 * Uses the agent's stored API key first, falls back to system-level HEALTHSHERPA_API_KEY
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try agent-stored key first
    let apiKey: string | null = null;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { healthSherpaApiKey: true },
    });

    apiKey = user?.healthSherpaApiKey || null;

    // Fall back to system key
    if (!apiKey) {
      apiKey = getSystemApiKey();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          message:
            "No HealthSherpa API key configured. Set HEALTHSHERPA_API_KEY in .env or add your key in Settings.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const quoteRequest = body.state
      ? {
          state: body.state,
          zip_code: body.zip_code || "90210",
          age: Number(body.age) || 35,
          gender: body.gender || "MALE",
          tobacco_use: Boolean(body.tobacco_use),
          income: Number(body.income) || 50000,
          household_size: Number(body.household_size) || 1,
        }
      : getSampleQuoteRequest(body.state);

    const config = { apiKey, sandbox: process.env.NODE_ENV === "development" };
    const quoteResponse = await fetchPlans(config, quoteRequest);

    return NextResponse.json(quoteResponse);
  } catch (error) {
    console.error("HealthSherpa quote error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch plans from HealthSherpa",
      },
      { status: 502 }
    );
  }
}