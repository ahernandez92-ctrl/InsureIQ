import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import CopyLinkButton from "./copy-link-button";

export default async function IntakeListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const tokens = await prisma.intakeToken.findMany({
    where: { agentId: session.user.id },
    include: {
      profile: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Intake</h1>
          <p className="mt-2 text-muted-foreground">
            Generate and manage client intake links
          </p>
        </div>
        <Link
          href="/portal/admin/intake/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Intake Link
        </Link>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Client
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                Expires
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  No intake links yet.{" "}
                  <Link
                    href="/portal/admin/intake/new"
                    className="text-primary hover:underline"
                  >
                    Create your first link
                  </Link>
                </td>
              </tr>
            ) : (
              tokens.map((t) => {
                const clientName = t.profile
                  ? `${t.profile.firstName} ${t.profile.lastName}`
                  : t.clientName || "—";
                const clientEmail = t.profile?.email || t.clientEmail || "";
                const isExpired = new Date() > t.expiresAt;
                const displayStatus = t.status === "COMPLETED"
                  ? "Completed"
                  : isExpired
                  ? "Expired"
                  : "Pending";

                const statusColor =
                  t.status === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : isExpired
                    ? "bg-gray-100 text-gray-700"
                    : "bg-blue-100 text-blue-700";

                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-medium">{clientName}</p>
                      {clientEmail && (
                        <p className="text-sm text-muted-foreground">
                          {clientEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {t.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {t.expiresAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status === "COMPLETED" && t.profile && (
                        <Link
                          href={`/portal/admin/analysis/${t.profile.id}`}
                          className="mr-4 text-sm font-medium text-primary hover:underline"
                        >
                          View Analysis
                        </Link>
                      )}
                      {t.status === "PENDING" && !isExpired && (
                        <CopyLinkButton token={t.token} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}