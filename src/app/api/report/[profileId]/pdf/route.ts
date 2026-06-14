import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAnalysisPdf } from "@/lib/report/pdf-generator";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/report/[profileId]/pdf
 * Download the analysis report as PDF
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

    // Verify ownership
    const report = await prisma.analysisReport.findUnique({
      where: { clientProfileId: profileId },
      select: { agentId: true, status: true },
    });

    if (!report || report.agentId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (report.status !== "COMPLETE") {
      return NextResponse.json(
        { message: "Analysis not yet complete. Generate it first." },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateAnalysisPdf(profileId, session.user.id);

    if (!pdfBuffer) {
      return NextResponse.json(
        { message: "PDF generation failed. PDF printer may not be available." },
        { status: 503 }
      );
    }

    // Get client name for filename
    const profile = await prisma.clientProfile.findUnique({
      where: { id: profileId },
      select: { firstName: true, lastName: true },
    });
    const clientName = profile
      ? `${profile.firstName}-${profile.lastName}`
      : "client";
    const filename = `InsureIQ-Report-${clientName}-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF download error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}