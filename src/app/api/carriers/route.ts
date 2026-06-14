import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const carriers = await prisma.carrier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(carriers);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { message: "Name and code are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.carrier.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { message: "A carrier with this code already exists" },
        { status: 409 }
      );
    }

    const carrier = await prisma.carrier.create({
      data: { name, code },
    });

    return NextResponse.json(carrier, { status: 201 });
  } catch (error) {
    console.error("Error creating carrier:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
