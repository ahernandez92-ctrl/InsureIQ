/**
 * InsureIQ Email Delivery Service
 *
 * Sends analysis reports to clients via Resend.
 * Can send plain analysis summaries or full PDF attachments.
 */

import { Resend } from "resend";

interface SendReportParams {
  to: string;
  clientName: string;
  agentName: string | null;
  agentEmail: string | null;
  reportUrl: string;
  pdfBuffer?: Buffer | null;
}

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send the analysis report to a client via email
 */
export async function sendReportEmail(params: SendReportParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const resend = getClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "reports@insureiq.app";

    // Build email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 24px; color: #1a1a2e; margin: 0; }
    .header p { color: #6b7280; margin: 8px 0 0; }
    .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .button:hover { background: #1d4ed8; }
    .footer { text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px; }
    .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Your Financial Protection Analysis</h1>
        <p>Prepared exclusively for ${escapeHtml(params.clientName)}</p>
      </div>

      <p>Dear ${escapeHtml(params.clientName)},</p>

      <p>Your personal financial protection analysis is ready. This report was prepared by your licensed insurance agent${params.agentName ? `, ${escapeHtml(params.agentName)}` : ""} using InsureIQ's AI-powered analysis platform.</p>

      <p>The report includes:</p>
      <ul>
        <li><strong>Risk Summary</strong> — A personalized overview of your health risk profile</li>
        <li><strong>Financial Scenario Analysis</strong> — Cost projections for routine care, emergency visits, and critical illness events</li>
        <li><strong>Protection Bundle Recommendations</strong> — Tiered coverage options tailored to your needs and budget</li>
        <li><strong>Product Eligibility</strong> — Available products and pricing from top carriers</li>
      </ul>

      <div style="text-align: center;">
        <a href="${escapeHtml(params.reportUrl)}" class="button">View Your Report</a>
      </div>

      <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
        You can also access this report at any time using the link above. 
        ${params.agentName ? `For questions, please contact your agent ${escapeHtml(params.agentName)}${params.agentEmail ? ` at <a href="mailto:${escapeHtml(params.agentEmail)}" style="color: #2563eb;">${escapeHtml(params.agentEmail)}</a>` : "."}` : ""}
      </p>

      <hr class="divider">

      <p style="font-size: 12px; color: #9ca3af;">
        <strong>Important:</strong> This analysis is for illustrative purposes only. The projections shown are estimates based on general industry data and do not constitute a guarantee of coverage, pricing, or eligibility. Actual rates and coverage terms are determined by insurance carriers during formal underwriting.
      </p>
    </div>

    <div class="footer">
      <p>Powered by InsureIQ — AI-Powered Insurance Analysis</p>
    </div>
  </div>
</body>
</html>`;

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (params.pdfBuffer) {
      attachments.push({
        filename: `InsureIQ-Report-${params.clientName.replace(/\s+/g, "-")}.pdf`,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      });
    }

    const response = await resend.emails.send({
      from: `InsureIQ <${fromEmail}>`,
      to: params.to,
      subject: `Your Financial Protection Analysis from InsureIQ${params.agentName ? ` (via ${params.agentName})` : ""}`,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}