import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: {
      carrier: { select: { name: true, code: true } },
      _count: { select: { prices: true } },
    },
    orderBy: [{ carrier: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, code, carrierId, category, description } =
      await request.json();

    if (!name || !code || !carrierId || !category) {
      return NextResponse.json(
        { message: "Name, code, carrierId, and category are required" },
        { status: 400 }
      );
    }

    const carrier = await prisma.carrier.findUnique({
      where: { id: carrierId },
    });

    if (!carrier) {
      return NextResponse.json(
        { message: "Carrier not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        code,
        carrierId,
        category,
        description,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
