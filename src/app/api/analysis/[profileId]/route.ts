import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAndSaveAnalysis } from "@/lib/analysis/engine";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/analysis/[profileId]
 * Trigger AI analysis for a completed client profile
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { profileId } = await params;

    // Verify the profile exists and belongs to this agent
    const profile = await prisma.clientProfile.findUnique({
      where: { id: profileId },
      include: {
        intakeToken: {
          select: { agentId: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    if (profile.intakeToken.agentId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Run the analysis
    const output = await generateAndSaveAnalysis(profileId, session.user.id);

    return NextResponse.json({
      message: "Analysis generated successfully",
      analysis: output,
    });
  } catch (error) {
    console.error("Error generating analysis:", error);
    return NextResponse.json(
      {
        message: "Analysis generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/[profileId]
 * Retrieve a saved analysis report
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { profileId } = await params;

    const report = await prisma.analysisReport.findUnique({
      where: { clientProfileId: profileId },
    });

    if (!report) {
      return NextResponse.json(
        { message: "No analysis found for this profile. Generate one first." },
        { status: 404 }
      );
    }

    // Verify ownership
    if (report.agentId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: report.id,
      status: report.status,
      riskSummary: report.riskSummary,
      narrative: report.narrative,
      eligibleProducts: report.eligibleProducts,
      ineligibleProducts: report.ineligibleProducts,
      scenarios: report.scenarios,
      bundles: report.bundles,
      generatedAt: report.generatedAt,
      errorMessage: report.errorMessage,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { message: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}