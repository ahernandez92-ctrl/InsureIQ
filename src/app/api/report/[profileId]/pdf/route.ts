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
      select: { agentId: true, status: true, reportPdfUrl: true },
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

    // If we have a stored PDF, we could fetch it or redirect
    // For a cleaner download experience with custom filename, we'll fetch it if available
    let pdfBuffer: Buffer | Uint8Array | null = null;
    
    if (report.reportPdfUrl) {
      try {
        const response = await fetch(report.reportPdfUrl);
        if (response.ok) {
          pdfBuffer = new Uint8Array(await response.arrayBuffer());
        }
      } catch (fetchError) {
        console.error("Failed to fetch stored PDF, falling back to generation:", fetchError);
      }
    }

    if (!pdfBuffer) {
      const generated = await generateAnalysisPdf(profileId, session.user.id);
      if (generated) pdfBuffer = new Uint8Array(generated);
    }

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