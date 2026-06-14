import { NextResponse } from "next/server";
import { testAnthropicConnection } from "@/lib/analysis/ai-client";

/**
 * GET /api/analysis/health
 * Health check endpoint to verify Anthropic AI connection
 */
export async function GET() {
  const result = await testAnthropicConnection();
  return NextResponse.json(result);
}