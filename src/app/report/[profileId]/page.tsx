import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientReportView from "./client-report-view";

interface PageProps {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ClientReportPage({ params, searchParams }: PageProps) {
  const { profileId } = await params;
  const { token } = await searchParams;

  // Verify the token matches the report ID (simple auth)
  if (!token) {
    notFound();
  }

  const report = await prisma.analysisReport.findUnique({
    where: { clientProfileId: profileId },
    include: {
      profile: {
        select: { firstName: true, lastName: true },
      },
      agent: {
        select: { name: true },
      },
    },
  });

  if (!report || report.status !== "COMPLETE" || report.id !== token) {
    notFound();
  }

  return (
    <ClientReportView
      clientName={`${report.profile.firstName} ${report.profile.lastName}`}
      agentName={report.agent.name}
      generatedAt={report.generatedAt?.toISOString() || ""}
      riskSummary={report.riskSummary || ""}
      narrative={report.narrative || ""}
      scenarios={report.scenarios as any}
      bundles={report.bundles as any}
      eligibleProducts={report.eligibleProducts as any[]}
    />
  );
}