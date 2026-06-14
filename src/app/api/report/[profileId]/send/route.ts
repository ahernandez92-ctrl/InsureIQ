import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendReportEmail } from "@/lib/report/email-service";
import { generateAnalysisPdf } from "@/lib/report/pdf-generator";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/report/[profileId]/send
 * Send analysis report via email to the client
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
    const body = await _request.json();
    const { to } = body; // Optional: override recipient email

    // Verify ownership and get report data
    const report = await prisma.analysisReport.findUnique({
      where: { clientProfileId: profileId },
      include: {
        profile: {
          select: { firstName: true, lastName: true, email: true },
        },
        agent: {
          select: { id: true, name: true, email: true },
        },
      },
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

    const clientName = `${report.profile.firstName} ${report.profile.lastName}`;
    const recipientEmail = to || report.profile.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { message: "No recipient email provided. Specify 'to' in request body or ensure client has an email." },
        { status: 400 }
      );
    }

    // Generate PDF attachment
    const pdfBuffer = await generateAnalysisPdf(profileId, session.user.id);

    // Build portal URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const reportUrl = `${baseUrl}/report/${profileId}?token=${report.id}`;

    // Send email
    const result = await sendReportEmail({
      to: recipientEmail,
      clientName,
      agentName: report.agent.name,
      agentEmail: report.agent.email,
      reportUrl,
      pdfBuffer,
    });

    if (result.success) {
      return NextResponse.json({
        message: "Report sent successfully",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { message: "Failed to send email", error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}