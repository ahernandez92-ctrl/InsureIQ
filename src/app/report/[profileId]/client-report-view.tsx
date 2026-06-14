"use client";

interface ClientReportViewProps {
  clientName: string;
  agentName: string | null;
  generatedAt: string;
  riskSummary: string;
  narrative: string;
  scenarios: any;
  bundles: any;
  eligibleProducts: any[];
}

export default function ClientReportView(props: ClientReportViewProps) {
  const { clientName, agentName, generatedAt, riskSummary, narrative, scenarios, bundles, eligibleProducts } = props;

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "LOW": return "bg-green-100 text-green-700";
      case "MODERATE": return "bg-yellow-100 text-yellow-700";
      case "HIGH": return "bg-orange-100 text-orange-700";
      case "SEVERE": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">InsureIQ</span>
            <span className="text-sm text-gray-400 hidden sm:inline">| Client Portal</span>
          </div>
          <div className="text-xs text-gray-400">
            Prepared by {agentName || "Your Agent"} &middot; {new Date(generatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Financial Protection Analysis</h1>
          <p className="text-gray-500 mt-1">Prepared exclusively for <strong>{clientName}</strong></p>
        </div>

        {/* Risk Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Risk Summary</h2>
          <div className="text-sm text-blue-800 whitespace-pre-line leading-relaxed">
            {riskSummary}
          </div>
        </div>

        {/* Scenario Analysis */}
        {scenarios && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Scenario Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "routineCare", label: "Routine & Preventive Care", icon: "🩺" },
                { key: "emergencyRoom", label: "Emergency Room Visit", icon: "🚑" },
                { key: "criticalIllness", label: "Critical Illness Event", icon: "❤️" },
              ].map(({ key, label, icon }) => {
                const s = scenarios[key];
                if (!s) return null;
                return (
                  <div key={key} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <h3 className="font-semibold text-gray-900">{label}</h3>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadgeClass(s.riskLevel)}`}>
                        {s.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{s.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Without coverage:</span>
                        <span className="font-semibold text-red-600">${(s.estimatedCostWithoutCoverage || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">With Essential:</span>
                        <span className="font-semibold">${(s.estimatedCostWithEssential || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">With Maximum:</span>
                        <span className="font-semibold text-green-600">${(s.estimatedCostWithMaximum || 0).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-gray-500 font-medium">Potential savings:</span>
                        <span className="font-semibold text-blue-600">${(s.potentialSavings || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {scenarios.summary && (
              <div className="mt-4 bg-blue-600 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>Recommended: <strong>{scenarios.summary.recommendedTier}</strong> Plan</span>
                <span>Monthly: <strong>${(scenarios.summary.monthlyInvestment || 0).toFixed(2)}</strong></span>
                <span>Annual: <strong>${(scenarios.summary.annualInvestment || 0).toFixed(2)}</strong></span>
                <span>Potential savings: <strong>${(scenarios.summary.totalPotentialSavings || 0).toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Bundle Recommendations */}
        {bundles && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Protection Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "essential", name: "Essential", recommended: false },
                { key: "comprehensive", name: "Comprehensive", recommended: true },
                { key: "maximum", name: "Maximum", recommended: false },
              ].map(({ key, name, recommended }) => {
                const b = bundles[key];
                if (!b) return null;
                return (
                  <div
                    key={key}
                    className={`rounded-xl p-5 ${recommended ? "border-2 border-blue-500 bg-blue-50" : "border border-gray-200 bg-white"}`}
                  >
                    {recommended && (
                      <div className="text-center mb-3">
                        <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          RECOMMENDED FOR YOU
                        </span>
                      </div>
                    )}
                    <h3 className={`font-semibold ${recommended ? "text-blue-900" : "text-gray-900"} text-center`}>{name}</h3>
                    <p className={`text-3xl font-bold text-center mt-1 ${recommended ? "text-blue-600" : "text-gray-900"}`}>
                      ${(b.monthlyTotal || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 text-center mb-3">/month</p>
                    <p className="text-xs text-gray-600 text-center mb-4">{b.description}</p>
                    {b?.coverageHighlights?.length > 0 && (
                      <ul className="space-y-1">
                        {b.coverageHighlights.map((h: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-green-500 flex-shrink-0">✓</span>
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

        {/* Eligible Products */}
        {eligibleProducts?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Products & Pricing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Carrier</th>
                    <th className="pb-2 font-medium text-right">Essential</th>
                    <th className="pb-2 font-medium text-right">Comprehensive</th>
                    <th className="pb-2 font-medium text-right">Maximum</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleProducts.map((p: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium text-gray-900">{p.productName}</td>
                      <td className="py-2 text-gray-600">{p.carrierName}</td>
                      <td className="py-2 text-right font-medium">
                        ${(p.pricing?.find((pr: any) => pr.tier === "ESSENTIAL")?.monthlyAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        ${(p.pricing?.find((pr: any) => pr.tier === "COMPREHENSIVE")?.monthlyAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        ${(p.pricing?.find((pr: any) => pr.tier === "MAXIMUM")?.monthlyAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Narrative */}
        {narrative && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Detailed Analysis</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {narrative}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center space-y-2">
          <div className="text-xs text-gray-400">
            <p><strong>Illustrative Only.</strong> This analysis is for informational purposes only. Projections are estimates based on general industry data. Actual rates, terms, and coverage are determined by carriers during formal underwriting.</p>
          </div>
          <div className="text-xs text-gray-400">
            <p>Powered by <strong>InsureIQ</strong> &middot; AI-Powered Insurance Analysis</p>
            {agentName && <p>Prepared by {agentName}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}