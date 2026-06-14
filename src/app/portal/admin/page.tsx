import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const carrierCount = await prisma.carrier.count();
  const productCount = await prisma.product.count();
  const reportCount = await prisma.analysisReport.count({
    where: { agentId: session?.user?.id },
  });
  const completedIntakeCount = await prisma.intakeToken.count({
    where: { agentId: session?.user?.id, status: "COMPLETED" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {session?.user?.name || "Agent"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Carriers
          </h3>
          <p className="mt-2 text-3xl font-bold">{carrierCount}</p>
          <Link
            href="/portal/admin/carriers"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Manage Carriers →
          </Link>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Products
          </h3>
          <p className="mt-2 text-3xl font-bold">{productCount}</p>
          <Link
            href="/portal/admin/products"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Manage Products →
          </Link>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pricing Tiers
          </h3>
          <p className="mt-2 text-3xl font-bold">--</p>
          <Link
            href="/portal/admin/pricing"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Manage Pricing →
          </Link>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Analysis Reports
          </h3>
          <p className="mt-2 text-3xl font-bold">{completedIntakeCount}</p>
          <Link
            href="/portal/admin/intake"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View Leads →
          </Link>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/portal/admin/intake/new"
            className="rounded-md border p-4 text-center hover:bg-secondary"
          >
            <p className="font-medium">New Intake Link</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Send to a client
            </p>
          </Link>
          <Link
            href="/portal/admin/intake"
            className="rounded-md border p-4 text-center hover:bg-secondary"
          >
            <p className="font-medium">View Leads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Review submissions
            </p>
          </Link>
          <Link
            href="/portal/admin/products"
            className="rounded-md border p-4 text-center hover:bg-secondary"
          >
            <p className="font-medium">Products</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage plans
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
