"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface AnalysisReport {
  id: string;
  status: string;
  riskSummary: string | null;
  narrative: string | null;
  eligibleProducts: any;
  ineligibleProducts: any;
  scenarios: any;
  bundles: any;
  generatedAt: string | null;
  errorMessage: string | null;
}

export default function AnalysisReportPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const { data: session } = useSession();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analysis/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else if (res.status === 404) {
        setReport(null);
      } else {
        setError("Failed to load analysis");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setGenerating(true);
      setError(null);
      setEmailSent(false);
      const res = await fetch(`/api/analysis/${profileId}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchReport();
      } else {
        const data = await res.json();
        setError(data.message || "Generation failed");
      }
    } catch {
      setError("Network error during generation");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await fetch(`/api/report/${profileId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `InsureIQ-Report-${profileId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        setError(data.message || "PDF download failed");
      }
    } catch {
      setError("Network error during PDF download");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const sendEmail = async () => {
    try {
      setSendingEmail(true);
      setError(null);
      const res = await fetch(`/api/report/${profileId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setEmailSent(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to send email");
      }
    } catch {
      setError("Network error during email send");
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [profileId]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // ── Empty State (No Report Yet) ──
  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Yet</h2>
          <p className="text-gray-500 mb-6">
            Generate an AI-powered financial analysis report for this client profile.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
          )}
          <button onClick={generateAnalysis} disabled={generating}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating Analysis...</>
            ) : (
              <><svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Generate Analysis</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (report.status === "ERROR") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h2>
          <p className="text-red-600">{report.errorMessage || "An unknown error occurred."}</p>
          <button onClick={generateAnalysis} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry Analysis</button>
        </div>
      </div>
    );
  }

  // ── Report View ──
  const scenarios = report.scenarios;
  const bundles = report.bundles;
  const eligibleProducts = report.eligibleProducts;

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-green-100 text-green-700",
      MODERATE: "bg-yellow-100 text-yellow-700",
      HIGH: "bg-orange-100 text-orange-700",
      SEVERE: "bg-red-100 text-red-700",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header with Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Analysis Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && (
            <div className="w-full sm:w-auto p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">{error}</div>
          )}
          {emailSent && (
            <div className="w-full sm:w-auto p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs">
              Report sent to client email!
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={sendEmail} disabled={sendingEmail}
              className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
              {sendingEmail ? (
                <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />Sending...</>
              ) : (
                <><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Email to Client</>
              )}
            </button>
            <button onClick={downloadPdf} disabled={downloadingPdf}
              className="inline-flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingPdf ? (
                <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />Downloading...</>
              ) : (
                <><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download PDF</>
              )}
            </button>
            <button onClick={generateAnalysis} disabled={generating}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Risk Summary ── */}
      {report.riskSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Risk Summary</h2>
          <div className="prose prose-sm text-blue-800 whitespace-pre-line">{report.riskSummary}</div>
        </div>
      )}

      {/* ── Scenario Cost Projections ── */}
      {scenarios && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Scenario Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "routineCare", label: "Routine & Preventive Care", s: scenarios.routineCare },
              { key: "emergencyRoom", label: "Emergency Room Visit", s: scenarios.emergencyRoom },
              { key: "criticalIllness", label: "Critical Illness Event", s: scenarios.criticalIllness },
            ].map(({ key, label, s }) => (
              <div key={key} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadge(s?.riskLevel)}`}>{s?.riskLevel}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{s?.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Without coverage:</span>
                    <span className="font-semibold text-red-600">${s?.estimatedCostWithoutCoverage?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">With Maximum:</span>
                    <span className="font-semibold text-green-600">${s?.estimatedCostWithMaximum?.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-500">Potential savings:</span>
                    <span className="font-semibold text-blue-600">${s?.potentialSavings?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {scenarios.summary && (
            <div className="mt-4 bg-blue-600 text-white rounded-lg p-4 flex flex-wrap items-center justify-between">
              <span className="font-medium">Recommended: <strong>{scenarios.summary.recommendedTier}</strong> plan</span>
              <span>Monthly: <strong>${scenarios.summary.monthlyInvestment?.toFixed(2)}</strong></span>
              <span>Annual: <strong>${scenarios.summary.annualInvestment?.toFixed(2)}</strong></span>
              <span>Potential savings: <strong>${scenarios.summary.totalPotentialSavings?.toLocaleString()}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── Bundle Recommendations ── */}
      {bundles && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Protection Bundles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "essential", name: "Essential", recommended: false },
              { key: "comprehensive", name: "Comprehensive", recommended: true },
              { key: "maximum", name: "Maximum", recommended: false },
            ].map(({ key, name, recommended }) => {
              const b = bundles[key];
              if (!b) return null;
              return (
                <div key={key} className={`rounded-lg p-5 ${recommended ? "border-2 border-blue-500 bg-blue-50 relative" : "border border-gray-200 bg-white"}`}>
                  {recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">RECOMMENDED</div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">${(b.monthlyTotal || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-3">/month</p>
                  <p className="text-sm text-gray-600 mb-3">{b.description}</p>
                  {b?.coverageHighlights?.length > 0 && (
                    <ul className="space-y-1.5">
                      {b.coverageHighlights.map((h: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Full Narrative ── */}
      {report.narrative && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Detailed Analysis</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">{report.narrative}</div>
        </div>
      )}

      {/* ── Eligible Products ── */}
      {eligibleProducts?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Eligible Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Carrier</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Essential</th>
                  <th className="pb-2 font-medium text-right">Comprehensive</th>
                  <th className="pb-2 font-medium text-right">Maximum</th>
                </tr>
              </thead>
              <tbody>
                {eligibleProducts.map((p: any) => (
                  <tr key={p.productId} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{p.productName}</td>
                    <td className="py-2 text-gray-600">{p.carrierName}</td>
                    <td className="py-2"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{p.category}</span></td>
                    <td className="py-2 text-right">${p.pricing?.find((pr: any) => pr.tier === "ESSENTIAL")?.monthlyAmount?.toFixed(2) || "-"}</td>
                    <td className="py-2 text-right">${p.pricing?.find((pr: any) => pr.tier === "COMPREHENSIVE")?.monthlyAmount?.toFixed(2) || "-"}</td>
                    <td className="py-2 text-right">${p.pricing?.find((pr: any) => pr.tier === "MAXIMUM")?.monthlyAmount?.toFixed(2) || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Client Portal Link ── */}
      {report.id && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Client Portal Link</h3>
          <p className="text-xs text-gray-500 mb-2">Share this link with your client for a read-only view of their report:</p>
          <div className="flex gap-2">
            <input type="text" readOnly value={`${window.location.origin}/report/${profileId}?token=${report.id}`}
              className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/report/${profileId}?token=${report.id}`);
            }} className="px-3 py-2 text-xs bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Copy
            </button>
          </div>
        </div>
      )}

      {/* ── Legal Disclaimer ── */}
      <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p><strong>Illustrative Only.</strong> This analysis is for informational and illustrative purposes only. 
        The projections, scenarios, and recommendations shown are estimates based on general industry data and 
        the information you provided. They do not constitute a guarantee of coverage, pricing, or eligibility. 
        Actual rates, terms, and coverage availability are determined by insurance carriers during formal 
        underwriting. Consult with your licensed insurance agent for personalized quotes and binding coverage.</p>
      </div>
    </div>
  );
}