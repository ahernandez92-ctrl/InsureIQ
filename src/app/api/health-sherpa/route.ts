import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyApiKey } from "@/lib/health-sherpa";

/**
 * GET /api/health-sherpa
 * Returns whether the user has configured a HealthSherpa API key (without exposing the key)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { healthSherpaApiKey: true },
  });

  return NextResponse.json({
    configured: !!user?.healthSherpaApiKey,
  });
}

/**
 * POST /api/health-sherpa
 * Store or update the HealthSherpa API key
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { message: "API key is required" },
        { status: 400 }
      );
    }

    // Validate the key by testing it against the HealthSherpa API
    const isValid = await verifyApiKey({ apiKey });

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid HealthSherpa API key. Please check and try again." },
        { status: 422 }
      );
    }

    // Store the key (in production, encrypt with AES-256 before storing)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { healthSherpaApiKey: apiKey },
    });

    return NextResponse.json({
      message: "HealthSherpa API key saved successfully",
      configured: true,
    });
  } catch (error) {
    console.error("Error saving HealthSherpa key:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health-sherpa
 * Remove the HealthSherpa API key
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { healthSherpaApiKey: null },
  });

  return NextResponse.json({
    message: "HealthSherpa API key removed",
    configured: false,
  });
}