import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const intakeToken = await prisma.intakeToken.findUnique({
      where: { token },
      include: {
        agent: {
          select: { name: true, email: true },
        },
      },
    });

    if (!intakeToken) {
      return NextResponse.json(
        { message: "Invalid intake link" },
        { status: 404 }
      );
    }

    if (intakeToken.status === "COMPLETED") {
      return NextResponse.json(
        { message: "This intake form has already been completed", status: "COMPLETED" },
        { status: 200 }
      );
    }

    if (new Date() > intakeToken.expiresAt) {
      return NextResponse.json(
        { message: "This intake link has expired", status: "EXPIRED" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      agentName: intakeToken.agent.name,
      clientName: intakeToken.clientName,
      clientEmail: intakeToken.clientEmail,
    });
  } catch (error) {
    console.error("Error verifying intake token:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}