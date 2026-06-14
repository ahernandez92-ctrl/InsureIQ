import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      carrier: { select: { id: true, name: true, code: true } },
      prices: { orderBy: [{ state: "asc" }, { ageFrom: "asc" }] },
    },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/portal/admin/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Products
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">
            {product.carrier.name} &middot; Code: {product.code}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            product.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Product Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Category</dt>
              <dd>
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {product.category}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Carrier</dt>
              <dd className="text-sm font-medium">{product.carrier.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Description</dt>
              <dd className="text-sm">{product.description || "No description"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Total Prices</dt>
              <dd className="text-sm font-medium">{product.prices.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 px-6 py-4">
          <h2 className="text-lg font-semibold">
            Pricing Tiers ({product.prices.length})
          </h2>
        </div>

        {product.prices.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No pricing data for this product. Upload pricing via the{" "}
            <Link href="/portal/admin/pricing" className="text-primary hover:underline">
              Pricing page
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">State</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Age Range</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Tier</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {product.prices.map((price) => (
                  <tr key={price.id} className="border-b last:border-0">
                    <td className="px-6 py-3 font-mono text-sm font-medium">{price.state}</td>
                    <td className="px-6 py-3 text-sm">
                      {price.ageFrom} - {price.ageTo}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {price.tier}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      ${Number(price.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}