/**
 * InsureIQ Anthropic AI Client
 *
 * Wraps the Anthropic Claude API to generate personalized,
 * plain-English insurance analysis narratives, risk summaries,
 * and actionable recommendations.
 *
 * The AI is given structured data (client profile, eligibility,
 * cost scenarios, bundle recommendations) and returns
 * natural language analysis that an agent can deliver
 * directly to their client.
 */

import Anthropic from "@anthropic-ai/sdk";

// Client-side singleton to avoid re-instantiating
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Configure it in your .env file."
      );
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ─── Prompt Templates ──────────────────────────────────────────

const RISK_SUMMARY_SYSTEM_PROMPT = `You are InsureIQ, an AI insurance analysis assistant for licensed health and life insurance agents. 
You generate personalized, plain-English risk summaries for insurance clients.

Your task is to analyze a client's profile data and write a concise risk summary (3-6 sentences) that:
1. Highlights their key health risk factors (conditions, age, tobacco use)
2. Notes how many products are available/not available to them
3. Identifies their biggest financial exposure or coverage gap
4. Uses warm, professional, client-friendly language

Format using plain text with **bold** for emphasis on key numbers or findings.
DO NOT use markdown headings or bullet lists in the risk summary.
Keep it concise — this is meant to be the "elevator pitch" the agent reads to the client.`;

const NARRATIVE_SYSTEM_PROMPT = `You are InsureIQ, an AI insurance analysis assistant for licensed health and life insurance agents.
You generate comprehensive, personalized, plain-English financial protection analysis narratives.

You are given structured data including:
- Client demographic and health profile
- Health conditions and medications
- Eligible and ineligible products
- Cost scenario projections (routine care, ER visit, critical illness)
- Tiered bundle recommendations (Essential, Comprehensive, Maximum)

Write a full narrative report that includes these sections (use markdown headings):

1. **Your Coverage Landscape** — Introduce the client's situation, age, state, dependents, and current coverage status. Mention their budget if provided.

2. **Health Risk Profile** — Discuss their specific health conditions, medications, and how these affect their risk profile. Be specific — mention conditions by name, not just "reported conditions." Explain what these conditions mean for insurance.

3. **Financial Exposure Analysis** — Break down the three scenarios (Routine Care, ER Visit, Critical Illness) with the costs. Explain what these numbers mean in real life. Use specific dollar amounts.

4. **Recommended Protection Plan** — Recommend the best bundle tier based on their profile and budget. Explain WHY this tier is best for THEIR specific situation. List the specific products included.

5. **Important Notice** — Include: "This analysis is for illustrative purposes only. Actual rates, eligibility, and coverage terms are determined by carriers during formal underwriting."

Style guidelines:
- Write in second person ("you", "your") as if speaking directly to the client
- Use **bold** for key numbers, product names, and important findings
- Be warm but professional — this will be read by both the agent and their client
- Provide actionable insights, not just data repetition
- If the client has specific health conditions, explain how they impact coverage options
- If the client's primary concern is stated, address it directly
- Keep the tone reassuring but honest about risks
- Maximum length: 800-1000 words`;

// ─── AI Functions ──────────────────────────────────────────────

/**
 * Generate a personalized risk summary using Claude
 */
export async function generateRiskSummaryWithAI(params: {
  age: number;
  state: string;
  gender: string | null;
  tobaccoUser: boolean;
  healthConditions: string[];
  medications: string;
  dependents: number;
  householdIncome: string | null;
  monthlyBudget: number | null;
  coverageGoals: string[];
  interestedProducts: string[];
  primaryConcern: string | null;
  hasExistingCoverage: boolean;
  existingCarrier: string | null;
  eligibleProductCount: number;
  ineligibleProductCount: number;
  largestExposure: number;
  largestExposureLabel: string;
  recommendedTier: string;
}): Promise<string> {
  const client = getClient();

  const userPrompt = `Generate a personalized risk summary for this insurance client:

## Client Profile
- Age: ${params.age}
- State: ${params.state}
- Gender: ${params.gender || "Not specified"}
- Tobacco User: ${params.tobaccoUser ? "Yes" : "No"}
- Dependents: ${params.dependents}
- Household Income: ${params.householdIncome || "Not provided"}
- Monthly Budget for Insurance: ${params.monthlyBudget ? `$${params.monthlyBudget}` : "Not provided"}
- Existing Coverage: ${params.hasExistingCoverage ? `Yes (${params.existingCarrier || "Carrier not specified"})` : "No"}
- Primary Concern: ${params.primaryConcern || "Not specified"}
- Interested Products: ${params.interestedProducts.join(", ") || "Not specified"}
- Coverage Goals: ${params.coverageGoals.join(", ") || "Not specified"}

## Health Information
- Health Conditions: ${params.healthConditions.join(", ") || "None reported"}
- Medications: ${params.medications}

## Eligibility Summary
- Eligible Products Found: ${params.eligibleProductCount}
- Ineligible Products: ${params.ineligibleProductCount}

## Financial Exposure
- Largest Financial Exposure: ${params.largestExposureLabel} ($${params.largestExposure.toLocaleString()})
- Recommended Tier: ${params.recommendedTier}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: RISK_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() ?? "Risk summary generation failed.";
}

/**
 * Generate a full personalized narrative using Claude
 */
export async function generateNarrativeWithAI(params: {
  age: number;
  state: string;
  gender: string | null;
  tobaccoUser: boolean;
  healthConditions: string[];
  medications: string;
  dependents: number;
  householdIncome: string | null;
  employmentStatus: string | null;
  monthlyBudget: number | null;
  coverageGoals: string[];
  interestedProducts: string[];
  primaryConcern: string | null;
  hasExistingCoverage: boolean;
  existingCarrier: string | null;
  eligibleProducts: Array<{
    name: string;
    category: string;
    carrier: string;
    essentialPrice: number;
    comprehensivePrice: number;
    maximumPrice: number;
  }>;
  ineligibleProducts: Array<{
    name: string;
    reason: string;
  }>;
  scenarios: {
    routineCare: {
      withoutCoverage: number;
      withEssential: number;
      withMaximum: number;
      savings: number;
    };
    emergencyRoom: {
      withoutCoverage: number;
      withEssential: number;
      withMaximum: number;
      savings: number;
    };
    criticalIllness: {
      withoutCoverage: number;
      withEssential: number;
      withMaximum: number;
      savings: number;
    };
    recommendedTier: string;
  };
  bundles: {
    essential: { monthlyTotal: number; description: string };
    comprehensive: { monthlyTotal: number; description: string };
    maximum: { monthlyTotal: number; description: string };
  };
}): Promise<string> {
  const client = getClient();

  const userPrompt = `Generate a comprehensive financial protection analysis narrative for this client:

## Client Profile
- Age: ${params.age}
- State: ${params.state}
- Gender: ${params.gender || "Not specified"}
- Tobacco User: ${params.tobaccoUser ? "Yes" : "No"}
- Dependents: ${params.dependents}
- Household Income: ${params.householdIncome || "Not provided"}
- Employment: ${params.employmentStatus || "Not provided"}
- Monthly Budget: ${params.monthlyBudget ? `$${params.monthlyBudget}` : "Not provided"}
- Existing Coverage: ${params.hasExistingCoverage ? `Yes${params.existingCarrier ? ` (${params.existingCarrier})` : ""}` : "No"}
- Primary Concern: "${params.primaryConcern || "Not specified"}"
- Coverage Goals: ${params.coverageGoals.join(", ") || "Not specified"}

## Health
- Conditions: ${params.healthConditions.join(", ") || "None reported"}
- Medications: ${params.medications}

## Eligible Products
${params.eligibleProducts.map((p) => `- ${p.name} (${p.carrier}) [${p.category}] — $${p.essentialPrice}/mo Essential, $${p.comprehensivePrice}/mo Comprehensive, $${p.maximumPrice}/mo Maximum`).join("\n") || "None"}

## Ineligible Products
${params.ineligibleProducts.map((p) => `- ${p.name}: ${p.reason}`).join("\n") || "None"}

## Scenario Projections
- Routine Care: Without=$${params.scenarios.routineCare.withoutCoverage}, Essential=$${params.scenarios.routineCare.withEssential}, Max=$${params.scenarios.routineCare.withMaximum}, Savings=$${params.scenarios.routineCare.savings}
- ER Visit: Without=$${params.scenarios.emergencyRoom.withoutCoverage}, Essential=$${params.scenarios.emergencyRoom.withEssential}, Max=$${params.scenarios.emergencyRoom.withMaximum}, Savings=$${params.scenarios.emergencyRoom.savings}
- Critical Illness: Without=$${params.scenarios.criticalIllness.withoutCoverage}, Essential=$${params.scenarios.criticalIllness.withEssential}, Max=$${params.scenarios.criticalIllness.withMaximum}, Savings=$${params.scenarios.criticalIllness.savings}
- Recommended Tier: ${params.scenarios.recommendedTier}

## Bundle Options
- Essential: $${params.bundles.essential.monthlyTotal}/mo — ${params.bundles.essential.description}
- Comprehensive: $${params.bundles.comprehensive.monthlyTotal}/mo — ${params.bundles.comprehensive.description}
- Maximum: $${params.bundles.maximum.monthlyTotal}/mo — ${params.bundles.maximum.description}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() ?? "Narrative generation failed.";
}

/**
 * Test the Anthropic connection
 */
export async function testAnthropicConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: "Reply with only the word: connected",
        },
      ],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    return {
      connected: true,
      message: textBlock?.text?.trim() ?? "Connected",
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}