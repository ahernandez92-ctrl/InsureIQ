import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CarrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carrier = await prisma.carrier.findUnique({
    where: { id },
    include: {
      products: {
        include: { _count: { select: { prices: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!carrier) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/portal/admin/carriers"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Carriers
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{carrier.name}</h1>
          <p className="text-muted-foreground">Code: {carrier.code}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            carrier.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {carrier.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products ({carrier.products.length})</h2>
            <Link
              href={`/portal/admin/products/new?carrierId=${carrier.id}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Product
            </Link>
          </div>
        </div>

        {carrier.products.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No products for this carrier yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Code</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Prices</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {carrier.products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{product.code}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{product._count.prices}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/portal/admin/products/${product.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}