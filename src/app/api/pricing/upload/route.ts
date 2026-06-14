import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    // Expected CSV format: product_code, state, age_from, age_to, tier, amount
    let imported = 0;
    let errors = 0;

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 6) {
        errors++;
        continue;
      }

      const [productCode, state, ageFrom, ageTo, tier, amount] = parts;

      const product = await prisma.product.findUnique({
        where: { code: productCode },
      });

      if (!product) {
        errors++;
        continue;
      }

      try {
        await prisma.price.create({
          data: {
            productId: product.id,
            state: state.toUpperCase(),
            ageFrom: parseInt(ageFrom),
            ageTo: parseInt(ageTo),
            tier: tier.toUpperCase(),
            amount: parseFloat(amount),
          },
        });
        imported++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      message: `Imported ${imported} pricing records (${errors} errors)`,
      imported,
      errors,
    });
  } catch (error) {
    console.error("Error uploading pricing:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
