import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const intakeToken = await prisma.intakeToken.findUnique({
      where: { token },
    });

    if (!intakeToken) {
      return NextResponse.json(
        { message: "Invalid intake link" },
        { status: 404 }
      );
    }

    if (intakeToken.status !== "PENDING") {
      return NextResponse.json(
        { message: "This intake form has already been completed" },
        { status: 400 }
      );
    }

    if (new Date() > intakeToken.expiresAt) {
      return NextResponse.json(
        { message: "This intake link has expired" },
        { status: 410 }
      );
    }

    const body = await request.json();

    // Create the client profile
    const clientProfile = await prisma.clientProfile.create({
      data: {
        intakeTokenId: intakeToken.id,
        ...body,
      },
    });

    // Mark token as completed
    await prisma.intakeToken.update({
      where: { id: intakeToken.id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json(
      {
        message: "Profile submitted successfully",
        id: clientProfile.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting intake:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}