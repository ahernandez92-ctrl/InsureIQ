import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CarriersPage() {
  const carriers = await prisma.carrier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carriers</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your insurance carriers and product lines
          </p>
        </div>
        <Link
          href="/portal/admin/carriers/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Carrier
        </Link>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Code
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Products
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {carriers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  No carriers added yet.{" "}
                  <Link
                    href="/portal/admin/carriers/new"
                    className="text-primary hover:underline"
                  >
                    Add your first carrier
                  </Link>
                </td>
              </tr>
            ) : (
              carriers.map((carrier) => (
                <tr key={carrier.id} className="border-b last:border-0">
                  <td className="px-6 py-4 font-medium">{carrier.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {carrier.code}
                  </td>
                  <td className="px-6 py-4">{carrier._count.products}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        carrier.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {carrier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/portal/admin/carriers/${carrier.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}