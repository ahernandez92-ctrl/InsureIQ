import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { clientName, clientEmail } = await request.json().catch(() => ({}));

    // Token expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const intakeToken = await prisma.intakeToken.create({
      data: {
        agentId: session.user.id,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    return NextResponse.json(
      {
        token: intakeToken.token,
        url: `${baseUrl}/intake/${intakeToken.token}`,
        expiresAt: intakeToken.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating intake token:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}