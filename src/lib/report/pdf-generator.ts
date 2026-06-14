/**
 * InsureIQ PDF Generation Service
 *
 * Generates branded, professional PDF reports from analysis data.
 * Uses puppeteer-core to render server-side HTML to PDF.
 * Falls back to inline HTML rendering if Chrome is unavailable.
 */

import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";

// ─── Chrome/Chromium executable search paths ────────────────────
const CHROME_PATHS = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/snap/bin/chromium",
  process.env.CHROME_PATH,
].filter(Boolean) as string[];

let chromeExecutablePath: string | null = null;

/**
 * Find a working Chrome/Chromium executable
 */
async function findChrome(): Promise<string | null> {
  if (chromeExecutablePath) return chromeExecutablePath;

  const { existsSync } = require("fs");
  for (const path of CHROME_PATHS) {
    if (path && existsSync(path)) {
      chromeExecutablePath = path;
      return path;
    }
  }

  // Try `which` as last resort
  const { execSync } = require("child_process");
  try {
    const result = execSync("which chromium-browser chromium google-chrome google-chrome-stable 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    if (result) {
      const firstPath = result.split("\n")[0].trim();
      chromeExecutablePath = firstPath;
      return firstPath;
    }
  } catch {
    // ignore
  }

  return null;
}

// ─── HTML Report Template ───────────────────────────────────────

interface ReportData {
  clientName: string;
  clientAge: number;
  clientState: string;
  generatedAt: string;
  agentName?: string;
  agentNpn?: string;
  riskSummary: string;
  narrative: string;
  eligibleProducts: any[];
  scenarios: any;
  bundles: any;
}

/**
 * Generate a polished, branded HTML report for PDF conversion
 */
export function generateReportHtml(data: ReportData): string {
  const scenarios = data.scenarios;
  const bundles = data.bundles;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Protection Analysis — ${escapeHtml(data.clientName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    .header .meta {
      text-align: right;
      font-size: 12px;
      color: #9ca3af;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-low { background: #d1fae5; color: #065f46; }
    .badge-moderate { background: #fef3c7; color: #92400e; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-severe { background: #fecaca; color: #991b1b; }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .risk-summary {
      background: linear-gradient(135deg, #eff6ff, #eef2ff);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      font-size: 14px;
      line-height: 1.7;
    }
    .scenario-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .scenario-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
    }
    .scenario-card h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .scenario-card .risk-level {
      font-size: 11px;
      margin-bottom: 12px;
    }
    .scenario-card .cost-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
    }
    .scenario-card .cost-row .label { color: #6b7280; }
    .scenario-card .cost-row .value { font-weight: 600; }
    .cost-without { color: #dc2626; }
    .cost-with-max { color: #059669; }
    .cost-savings { color: #2563eb; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
    .summary-bar {
      background: #2563eb;
      color: white;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: space-between;
      font-size: 13px;
    }
    .bundle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .bundle-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
    }
    .bundle-card.recommended {
      border: 2px solid #2563eb;
      background: #eff6ff;
    }
    .bundle-card h3 { font-size: 15px; font-weight: 600; }
    .bundle-card .price { font-size: 28px; font-weight: 700; margin: 4px 0 2px; }
    .bundle-card .price-label { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
    .bundle-card .desc { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
    .bundle-card ul { list-style: none; font-size: 12px; }
    .bundle-card ul li { padding: 3px 0; color: #4b5563; }
    .bundle-card ul li::before { content: "✓ "; color: #059669; font-weight: 700; }
    .recommended-tag {
      display: inline-block;
      background: #2563eb;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .eligible-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .eligible-table th {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #e5e7eb;
      color: #6b7280;
      font-weight: 600;
    }
    .eligible-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .narrative {
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-line;
    }
    .narrative strong { font-weight: 600; }
    .disclaimer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
    }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>InsureIQ</h1>
      <p class="subtitle">Financial Protection Analysis</p>
    </div>
    <div class="meta">
      <p>Prepared for: <strong>${escapeHtml(data.clientName)}</strong></p>
      <p>Date: ${new Date(data.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      ${data.agentName ? `<p>Agent: ${escapeHtml(data.agentName)}</p>` : ""}
      ${data.agentNpn ? `<p>NPN: ${escapeHtml(data.agentNpn)}</p>` : ""}
    </div>
  </div>

  <div class="risk-summary">
    ${data.riskSummary.split("\n").filter(Boolean).map(line => `<p style="margin-bottom: 6px;">${line}</p>`).join("\n")}
  </div>

  <div class="section">
    <h2>Financial Scenario Analysis</h2>
    <div class="scenario-grid">
      ${renderScenarioCard(scenarios?.routineCare)}
      ${renderScenarioCard(scenarios?.emergencyRoom)}
      ${renderScenarioCard(scenarios?.criticalIllness)}
    </div>
    ${scenarios?.summary ? `
    <div class="summary-bar">
      <span>Recommended: <strong>${scenarios.summary.recommendedTier}</strong> Plan</span>
      <span>Monthly: <strong>$${(scenarios.summary.monthlyInvestment || 0).toFixed(2)}</strong></span>
      <span>Annual: <strong>$${(scenarios.summary.annualInvestment || 0).toFixed(2)}</strong></span>
      <span>Potential Savings: <strong>$${(scenarios.summary.totalPotentialSavings || 0).toLocaleString()}</strong></span>
    </div>` : ""}
  </div>

  <div class="section">
    <h2>Recommended Protection Bundles</h2>
    <div class="bundle-grid">
      ${renderBundleCard(bundles?.essential, "Essential", false)}
      ${renderBundleCard(bundles?.comprehensive, "Comprehensive", true)}
      ${renderBundleCard(bundles?.maximum, "Maximum", false)}
    </div>
  </div>

  ${data.eligibleProducts?.length > 0 ? `
  <div class="section">
    <h2>Eligible Products & Pricing</h2>
    <table class="eligible-table">
      <thead>
        <tr><th>Product</th><th>Carrier</th><th>Category</th><th style="text-align:right">Essential</th><th style="text-align:right">Comp</th><th style="text-align:right">Max</th></tr>
      </thead>
      <tbody>
        ${data.eligibleProducts.map((p: any) => `
        <tr>
          <td><strong>${escapeHtml(p.productName || "")}</strong></td>
          <td>${escapeHtml(p.carrierName || "")}</td>
          <td><span style="background:#f3f4f6;padding:2px 8px;border-radius:10px;font-size:11px;">${escapeHtml(p.category || "")}</span></td>
          <td style="text-align:right;font-weight:600">$${(p.pricing?.find((pr: any) => pr.tier === "ESSENTIAL")?.monthlyAmount || 0).toFixed(2)}</td>
          <td style="text-align:right;font-weight:600">$${(p.pricing?.find((pr: any) => pr.tier === "COMPREHENSIVE")?.monthlyAmount || 0).toFixed(2)}</td>
          <td style="text-align:right;font-weight:600">$${(p.pricing?.find((pr: any) => pr.tier === "MAXIMUM")?.monthlyAmount || 0).toFixed(2)}</td>
        </tr>`).join("\n")}
      </tbody>
    </table>
  </div>` : ""}

  ${data.narrative ? `
  <div class="section">
    <h2>Detailed Analysis</h2>
    <div class="narrative">${data.narrative}</div>
  </div>` : ""}

  <div class="disclaimer">
    <strong>Illustrative Only.</strong> This analysis is prepared by InsureIQ for informational and illustrative purposes only. The projections, scenarios, and recommendations shown are estimates based on general industry data and the information provided by the client. They do not constitute a guarantee of coverage, pricing, or eligibility. Actual rates, terms, and coverage availability are determined by insurance carriers during formal underwriting. This report is not a contract of insurance. Consult with your licensed insurance agent for personalized quotes and binding coverage.
  </div>

  <div class="footer">
    <span>InsureIQ — AI-Powered Insurance Analysis</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}

function renderScenarioCard(scenario: any): string {
  if (!scenario) return "";
  const riskColor = scenario.riskLevel === "LOW" ? "low" : scenario.riskLevel === "MODERATE" ? "moderate" : scenario.riskLevel === "HIGH" ? "high" : "severe";
  return `
    <div class="scenario-card">
      <h3>${escapeHtml(scenario.label || "")}</h3>
      <div class="risk-level"><span class="badge badge-${riskColor}">${scenario.riskLevel || "N/A"}</span></div>
      <div class="cost-row"><span class="label">Without coverage</span><span class="value cost-without">$${(scenario.estimatedCostWithoutCoverage || 0).toLocaleString()}</span></div>
      <div class="cost-row"><span class="label">Essential</span><span class="value">$${(scenario.estimatedCostWithEssential || 0).toLocaleString()}</span></div>
      <div class="cost-row"><span class="label">Maximum</span><span class="value cost-with-max">$${(scenario.estimatedCostWithMaximum || 0).toLocaleString()}</span></div>
      <div class="cost-row cost-savings"><span class="label">Potential savings</span><span class="value">$${(scenario.potentialSavings || 0).toLocaleString()}</span></div>
    </div>`;
}

function renderBundleCard(bundle: any, name: string, recommended: boolean): string {
  if (!bundle) return "";
  return `
    <div class="bundle-card ${recommended ? "recommended" : ""}">
      ${recommended ? '<div class="recommended-tag">RECOMMENDED</div>' : ""}
      <h3>${name}</h3>
      <div class="price">$${(bundle.monthlyTotal || 0).toFixed(2)}</div>
      <div class="price-label">/month</div>
      <div class="desc">${escapeHtml(bundle.description || "")}</div>
      ${bundle.coverageHighlights?.length > 0 ? `
      <ul>
        ${bundle.coverageHighlights.map((h: string) => `<li>${escapeHtml(h)}</li>`).join("\n")}
      </ul>` : ""}
    </div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── PDF Generation ─────────────────────────────────────────────

/**
 * Generate a PDF from the analysis report data.
 * Uses puppeteer-core with system Chromium if available,
 * otherwise returns null (caller should fall back to HTML view).
 */
export async function generatePdf(
  data: ReportData
): Promise<Buffer | null> {
  try {
    const chromePath = await findChrome();
    if (!chromePath) {
      console.warn("No Chrome/Chromium found. PDF generation unavailable.");
      return null;
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });

    const html = generateReportHtml(data);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true,
      displayHeaderFooter: false,
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return null;
  }
}

/**
 * Fetch analysis data and generate PDF in one call
 */
export async function generateAnalysisPdf(
  profileId: string,
  agentId: string
): Promise<Buffer | null> {
  const report = await prisma.analysisReport.findUnique({
    where: { clientProfileId: profileId },
    include: {
      profile: {
        select: { firstName: true, lastName: true },
      },
      agent: {
        select: { name: true, npn: true },
      },
    },
  });

  if (!report || report.status !== "COMPLETE") return null;
  if (report.agentId !== agentId) return null;

  const reportData: ReportData = {
    clientName: `${report.profile.firstName} ${report.profile.lastName}`,
    clientAge: 0, // Will be populated from the profile data
    clientState: "",
    generatedAt: report.generatedAt?.toISOString() || new Date().toISOString(),
    agentName: report.agent.name || undefined,
    agentNpn: report.agent.npn || undefined,
    riskSummary: report.riskSummary || "",
    narrative: report.narrative || "",
    eligibleProducts: report.eligibleProducts as any[] || [],
    scenarios: report.scenarios,
    bundles: report.bundles,
  };

  return generatePdf(reportData);
}