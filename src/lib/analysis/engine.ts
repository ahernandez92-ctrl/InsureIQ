/**
 * InsureIQ AI Analysis Engine
 *
 * Core module that:
 * 1. Normalizes raw client profile data into analysis-ready structures
 * 2. Runs eligibility filtering against available products/pricing
 * 3. Generates scenario-based cost projections (Routine, ER, Critical Illness)
 * 4. Recommends tiered bundles (Essential, Comprehensive, Maximum)
 * 5. Generates plain-English narrative via AI or template fallback
 */

import { prisma } from "@/lib/prisma";
import {
  type NormalizedClient,
  type EligibilityResult,
  type EligibleProduct,
  type IneligibleProduct,
  type ScenarioProjections,
  type ScenarioDetail,
  type BundleRecommendations,
  type Bundle,
  type AnalysisOutput,
  COST_CONSTANTS,
  CONDITION_RISK_WEIGHTS,
} from "./types";
import {
  generateRiskSummaryWithAI,
  generateNarrativeWithAI,
} from "./ai-client";
import { generatePdf } from "@/lib/report/pdf-generator";
import { uploadReportPdf } from "@/lib/report/storage";

// ─── 1. DATA NORMALIZATION ──────────────────────────────────────

/**
 * Calculate age from a Date of Birth string
 */
export function calculateAge(dateOfBirth: Date | string | null): number {
  if (!dateOfBirth) return 35; // Default to mid-range if unknown
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Parse JSON string fields from client profile, handling null/invalid gracefully
 */
function safeParseJson(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [jsonStr];
  } catch {
    return jsonStr.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

/**
 * Normalize a raw client profile into a structured analysis-ready object
 */
export function normalizeClientProfile(profile: {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string | null;
  gender: string | null;
  state?: string | null;
  maritalStatus: string | null;
  dependents: number;
  householdIncome: string | null;
  employmentStatus: string | null;
  tobaccoUser: boolean | null;
  healthConditions: string | null;
  medications: string | null;
  monthlyBudget: any | null;
  coverageGoals: string | null;
  interestedProducts: string | null;
  primaryConcern: string | null;
  hasExistingCoverage: boolean;
  existingCarrier: string | null;
}): NormalizedClient {
  return {
    age: calculateAge(profile.dateOfBirth),
    state: profile.state || "CA",
    gender: (profile.gender as "MALE" | "FEMALE") || null,
    tobaccoUser: profile.tobaccoUser ?? false,
    dependents: profile.dependents ?? 0,
    householdIncome: profile.householdIncome,
    employmentStatus: profile.employmentStatus,
    hasExistingCoverage: profile.hasExistingCoverage,
    existingCarrier: profile.existingCarrier,
    monthlyBudget: profile.monthlyBudget ? Number(profile.monthlyBudget) : null,
    healthConditions: safeParseJson(profile.healthConditions),
    medications: profile.medications || "None reported",
    coverageGoals: safeParseJson(profile.coverageGoals),
    interestedProducts: safeParseJson(profile.interestedProducts),
    primaryConcern: profile.primaryConcern,
  };
}

// ─── 2. ELIGIBILITY FILTERING ───────────────────────────────────

/**
 * Determine if a product is eligible for a client based on age, state, and health
 */
function isProductEligible(
  product: { id: string; name: string; code: string; category: string; carrier: { name: string; code: string }; prices: Array<{ state: string; ageFrom: number; ageTo: number }> },
  client: NormalizedClient
): { eligible: boolean; reason?: string } {
  // If no pricing data exists, assume eligible (pricing can be added later)
  if (!product.prices || product.prices.length === 0) {
    return { eligible: false, reason: "No pricing data available for this product" };
  }

  // Check if any pricing row covers this client's state and age
  const hasRelevantPricing = product.prices.some(
    (p) =>
      p.state === client.state &&
      client.age >= p.ageFrom &&
      client.age <= p.ageTo
  );

  if (!hasRelevantPricing) {
    return {
      eligible: false,
      reason: `Product not available for age ${client.age} in ${client.state}`,
    };
  }

  // Life insurance age cap
  if (product.category === "LIFE" && client.age > 70) {
    return { eligible: false, reason: "Age exceeds maximum for life insurance products" };
  }

  return { eligible: true };
}

/**
 * Fetch and filter all eligible/ineligible products for a client
 */
export async function determineEligibility(
  client: NormalizedClient,
  agentId: string
): Promise<EligibilityResult> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      agents: { some: { id: agentId } },
    },
    include: {
      carrier: { select: { name: true, code: true } },
      prices: {
        select: { state: true, ageFrom: true, ageTo: true, tier: true, amount: true },
      },
    },
  });

  const eligibleProducts: EligibleProduct[] = [];
  const ineligibleProducts: IneligibleProduct[] = [];

  for (const product of products) {
    const result = isProductEligible(product, client);

    if (result.eligible) {
      // Build pricing options for each tier
      const pricing = product.prices
        .filter((p) => p.state === client.state)
        .map((p) => ({
          tier: p.tier as "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM",
          amount: Number(p.amount),
          monthlyAmount: Math.round(Number(p.amount) / 12 * 100) / 100,
        }))
        // Deduplicate by tier (keep the one closest to client's age)
        .reduce((acc, curr) => {
          const existing = acc.find((a) => a.tier === curr.tier);
          if (!existing) acc.push(curr);
          return acc;
        }, [] as Array<{ tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"; amount: number; monthlyAmount: number }>);

      eligibleProducts.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        carrierName: product.carrier.name,
        carrierCode: product.carrier.code,
        pricing,
      });
    } else {
      ineligibleProducts.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        carrierName: product.carrier.name,
        reason: result.reason!,
      });
    }
  }

  return { eligibleProducts, ineligibleProducts };
}

// ─── 3. SCENARIO ENGINE ─────────────────────────────────────────

/**
 * Map health conditions to an overall risk level
 */
function calculateHealthRisk(conditions: string[]): "LOW" | "MODERATE" | "HIGH" | "SEVERE" {
  if (!conditions.length) return "LOW";

  const riskLevels = conditions.map(
    (c) => CONDITION_RISK_WEIGHTS[c.toUpperCase().replace(/\s+/g, "_")] || "MODERATE"
  );

  if (riskLevels.includes("SEVERE")) return "SEVERE";
  if (riskLevels.includes("HIGH")) return "HIGH";
  if (riskLevels.includes("MODERATE")) return "MODERATE";
  return "LOW";
}

/**
 * Calculate coverage effectiveness multipliers based on tier
 */
function getCoverageMultiplier(tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number {
  switch (tier) {
    case "ESSENTIAL": return 0.4;  // Covers 40% of costs
    case "COMPREHENSIVE": return 0.65; // Covers 65%
    case "MAXIMUM": return 0.85; // Covers 85%
  }
}

/**
 * Calculate scenario cost projections for Routine, ER, and Critical Illness
 */
export function calculateScenarios(
  client: NormalizedClient,
  eligibleProducts: EligibleProduct[]
): ScenarioProjections {
  const healthRisk = calculateHealthRisk(client.healthConditions);

  // Get average monthly premium from eligible products by tier
  const avgPremium = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number => {
    const premiums = eligibleProducts
      .flatMap((p) => p.pricing)
      .filter((p) => p.tier === tier)
      .map((p) => p.monthlyAmount);
    if (premiums.length === 0) return tier === "ESSENTIAL" ? 150 : tier === "COMPREHENSIVE" ? 300 : 500;
    return Math.round(premiums.reduce((a, b) => a + b, 0) / premiums.length);
  };

  // ── Routine Care Scenario ──
  const routineCostWithoutCoverage =
    COST_CONSTANTS.ROUTINE_DOCTOR_VISIT * COST_CONSTANTS.ROUTINE_VISITS_PER_YEAR +
    COST_CONSTANTS.ROUTINE_PRESCRIPTIONS_MONTHLY * 12 +
    COST_CONSTANTS.ROUTINE_PREVENTIVE;

  const calcRoutine = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number => {
    const multiplier = getCoverageMultiplier(tier);
    const annualPremium = avgPremium(tier) * 12;
    const covered = routineCostWithoutCoverage * multiplier;
    return Math.round(routineCostWithoutCoverage - covered + annualPremium);
  };

  const routineEssential = calcRoutine("ESSENTIAL");
  const routineComprehensive = calcRoutine("COMPREHENSIVE");
  const routineMaximum = calcRoutine("MAXIMUM");

  // ── Emergency Room Scenario ──
  const erCostWithoutCoverage =
    COST_CONSTANTS.ER_VISIT_COST +
    (client.tobaccoUser ? COST_CONSTANTS.ER_AMBULANCE : 0) +
    COST_CONSTANTS.ER_DIAGNOSTICS +
    COST_CONSTANTS.ER_FOLLOW_UP;

  const calcER = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number => {
    const multiplier = getCoverageMultiplier(tier);
    const covered = erCostWithoutCoverage * multiplier;
    return Math.round(erCostWithoutCoverage - covered);
  };

  const erEssential = calcER("ESSENTIAL");
  const erComprehensive = calcER("COMPREHENSIVE");
  const erMaximum = calcER("MAXIMUM");

  // ── Critical Illness Scenario ──
  const ciHospitalCost = COST_CONSTANTS.CI_HOSPITALIZATION_DAILY * COST_CONSTANTS.CI_HOSPITAL_DAYS;
  const ciCostWithoutCoverage =
    ciHospitalCost +
    COST_CONSTANTS.CI_SURGERY +
    COST_CONSTANTS.CI_POST_OP_CARE +
    COST_CONSTANTS.CI_LOST_INCOME_MONTHS * COST_CONSTANTS.CI_MONTHLY_INCOME_REPLACEMENT;

  const calcCI = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number => {
    const multiplier = getCoverageMultiplier(tier);
    const covered = ciCostWithoutCoverage * multiplier;
    return Math.round(ciCostWithoutCoverage - covered);
  };

  const ciEssential = calcCI("ESSENTIAL");
  const ciComprehensive = calcCI("COMPREHENSIVE");
  const ciMaximum = calcCI("MAXIMUM");

  // ── Build Scenario Details ──
  const buildScenarioDetail = (
    label: string,
    description: string,
    withoutCoverage: number,
    essential: number,
    comprehensive: number,
    maximum: number,
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE"
  ): ScenarioDetail => ({
    label,
    description,
    estimatedCostWithoutCoverage: withoutCoverage,
    estimatedCostWithEssential: essential,
    estimatedCostWithComprehensive: comprehensive,
    estimatedCostWithMaximum: maximum,
    potentialSavings: withoutCoverage - maximum,
    riskLevel,
  });

  // Determine risk levels adjusted by health conditions
  const routineRisk = healthRisk === "SEVERE" ? "MODERATE" : "LOW";
  const erRisk = healthRisk;
  const ciRisk = healthRisk === "LOW" ? "MODERATE" : healthRisk;

  const routineCare = buildScenarioDetail(
    "Routine & Preventive Care",
    "Annual checkups, prescriptions, and preventive services",
    routineCostWithoutCoverage,
    routineEssential,
    routineComprehensive,
    routineMaximum,
    routineRisk
  );

  const emergencyRoom = buildScenarioDetail(
    "Emergency Room Visit",
    "Unexpected ER visit including ambulance, diagnostics, and follow-up",
    erCostWithoutCoverage,
    erEssential,
    erComprehensive,
    erMaximum,
    erRisk
  );

  const criticalIllness = buildScenarioDetail(
    "Critical Illness Event",
    "Major health event such as heart attack, stroke, or cancer diagnosis",
    ciCostWithoutCoverage,
    ciEssential,
    ciComprehensive,
    ciMaximum,
    ciRisk
  );

  // Determine recommended tier based on budget and risk
  const monthlyBudget = client.monthlyBudget || 500;
  const totalEssential = avgPremium("ESSENTIAL") * 12;
  const totalComp = avgPremium("COMPREHENSIVE") * 12;
  const totalMax = avgPremium("MAXIMUM") * 12;

  let recommendedTier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM" = "ESSENTIAL";
  if (monthlyBudget >= avgPremium("MAXIMUM")) {
    recommendedTier = "MAXIMUM";
  } else if (monthlyBudget >= avgPremium("COMPREHENSIVE")) {
    recommendedTier = "COMPREHENSIVE";
  }

  const totalSavingsMax = routineCare.potentialSavings + emergencyRoom.potentialSavings + criticalIllness.potentialSavings;
  const monthlyInvestment = avgPremium(recommendedTier);

  return {
    routineCare,
    emergencyRoom,
    criticalIllness,
    summary: {
      totalPotentialSavings: totalSavingsMax,
      recommendedTier,
      monthlyInvestment,
      annualInvestment: monthlyInvestment * 12,
    },
  };
}

// ─── 4. BUNDLE RECOMMENDATIONS ──────────────────────────────────

/**
 * Generate tiered bundle recommendations from eligible products
 */
export function generateBundles(
  eligibleProducts: EligibleProduct[],
  client: NormalizedClient,
  scenarios: ScenarioProjections
): BundleRecommendations {
  // Separate products by category
  const healthProducts = eligibleProducts.filter((p) => p.category === "HEALTH");
  const lifeProducts = eligibleProducts.filter((p) => p.category === "LIFE");
  const supplementalProducts = eligibleProducts.filter((p) => p.category === "SUPPLEMENTAL");

  // Helper to pick the best product from a category (lowest premium for tier)
  const pickBest = (
    products: EligibleProduct[],
    tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"
  ): EligibleProduct | null => {
    if (products.length === 0) return null;
    return products.sort((a, b) => {
      const aPrice = a.pricing.find((p) => p.tier === tier)?.amount ?? Infinity;
      const bPrice = b.pricing.find((p) => p.tier === tier)?.amount ?? Infinity;
      return aPrice - bPrice;
    })[0];
  };

  // Calculate tier premiums
  const tierPremium = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): number => {
    const health = pickBest(healthProducts, tier);
    const life = pickBest(lifeProducts, tier);
    const supp = pickBest(supplementalProducts, tier);

    let total = 0;
    if (health) {
      const p = health.pricing.find((p) => p.tier === tier);
      if (p) total += p.monthlyAmount;
    }
    if (life) {
      const p = life.pricing.find((p) => p.tier === tier);
      if (p) total += p.monthlyAmount;
    }
    if (supp) {
      const p = supp.pricing.find((p) => p.tier === tier);
      if (p) total += p.monthlyAmount;
    }

    // Fallback estimates if no pricing available
    if (total === 0) {
      total = tier === "ESSENTIAL" ? 199 : tier === "COMPREHENSIVE" ? 349 : 549;
    }
    return Math.round(total * 100) / 100;
  };

  const buildBundleProducts = (tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM"): Bundle["products"] => {
    const products: Bundle["products"] = [];

    const health = pickBest(healthProducts, tier);
    const life = pickBest(lifeProducts, tier);
    const supp = pickBest(supplementalProducts, tier);

    if (health) {
      const p = health.pricing.find((p) => p.tier === tier);
      products.push({
        productId: health.productId,
        productName: health.productName,
        carrierName: health.carrierName,
        tier,
        monthlyAmount: p?.monthlyAmount ?? 0,
      });
    }
    if (life) {
      const p = life.pricing.find((p) => p.tier === tier);
      products.push({
        productId: life.productId,
        productName: life.productName,
        carrierName: life.carrierName,
        tier,
        monthlyAmount: p?.monthlyAmount ?? 0,
      });
    }
    if (supp) {
      const p = supp.pricing.find((p) => p.tier === tier);
      products.push({
        productId: supp.productId,
        productName: supp.productName,
        carrierName: supp.carrierName,
        tier,
        monthlyAmount: p?.monthlyAmount ?? 0,
      });
    }

    return products;
  };

  const monthlyEssential = tierPremium("ESSENTIAL");
  const monthlyComprehensive = tierPremium("COMPREHENSIVE");
  const monthlyMaximum = tierPremium("MAXIMUM");

  return {
    essential: {
      name: "Essential Protection",
      description: "Core coverage for routine and preventive care needs",
      products: buildBundleProducts("ESSENTIAL"),
      monthlyTotal: monthlyEssential,
      annualTotal: Math.round(monthlyEssential * 12 * 100) / 100,
      coverageHighlights: [
        "Covers routine checkups and preventive care",
        "Basic prescription drug coverage",
        "Essential ER visit protection",
        "$0 deductible preventive services",
      ],
    },
    comprehensive: {
      name: "Comprehensive Protection",
      description: "Enhanced coverage including supplemental benefits",
      products: buildBundleProducts("COMPREHENSIVE"),
      monthlyTotal: monthlyComprehensive,
      annualTotal: Math.round(monthlyComprehensive * 12 * 100) / 100,
      coverageHighlights: [
        "Everything in Essential, plus:",
        "Enhanced ER and hospitalization coverage",
        "Supplemental accident protection",
        "Lower deductibles and copays",
        "Telehealth services included",
      ],
    },
    maximum: {
      name: "Maximum Protection",
      description: "Full-spectrum coverage for maximum financial security",
      products: buildBundleProducts("MAXIMUM"),
      monthlyTotal: monthlyMaximum,
      annualTotal: Math.round(monthlyMaximum * 12 * 100) / 100,
      coverageHighlights: [
        "Everything in Comprehensive, plus:",
        "Critical illness lump-sum benefit",
        "Hospital indemnity coverage",
        "Out-of-pocket maximum protection",
        "Family coverage options",
        "Wellness program incentives",
      ],
    },
  };
}

// ─── 5. AI-POWERED NARRATIVE GENERATION ──────────────────────────

/**
 * Rate limit safety: minimum delay between API calls (ms)
 */
const AI_CALL_DELAY_MS = 250;

/**
 * Generate a personalized plain-English risk summary using Claude AI.
 * Falls back to template-based generation if AI is unavailable.
 */
export async function generateRiskSummary(
  client: NormalizedClient,
  eligibility: EligibilityResult,
  scenarios: ScenarioProjections
): Promise<string> {
  try {
    const summary = await generateRiskSummaryWithAI({
      age: client.age,
      state: client.state,
      gender: client.gender,
      tobaccoUser: client.tobaccoUser,
      healthConditions: client.healthConditions,
      medications: client.medications,
      dependents: client.dependents,
      householdIncome: client.householdIncome,
      monthlyBudget: client.monthlyBudget,
      coverageGoals: client.coverageGoals,
      interestedProducts: client.interestedProducts,
      primaryConcern: client.primaryConcern,
      hasExistingCoverage: client.hasExistingCoverage,
      existingCarrier: client.existingCarrier,
      eligibleProductCount: eligibility.eligibleProducts.length,
      ineligibleProductCount: eligibility.ineligibleProducts.length,
      largestExposure: scenarios.criticalIllness.estimatedCostWithoutCoverage,
      largestExposureLabel: scenarios.criticalIllness.label,
      recommendedTier: scenarios.summary.recommendedTier,
    });

    await delay(AI_CALL_DELAY_MS);
    return summary;
  } catch (error) {
    console.warn("AI risk summary failed, using template fallback:", error);
    return generateRiskSummaryTemplate(client, eligibility, scenarios);
  }
}

/**
 * Generate a full personalized analysis narrative using Claude AI.
 * Falls back to template-based generation if AI is unavailable.
 */
export async function generateNarrative(
  client: NormalizedClient,
  eligibility: EligibilityResult,
  scenarios: ScenarioProjections,
  bundles: BundleRecommendations
): Promise<string> {
  try {
    const narrative = await generateNarrativeWithAI({
      age: client.age,
      state: client.state,
      gender: client.gender,
      tobaccoUser: client.tobaccoUser,
      healthConditions: client.healthConditions,
      medications: client.medications,
      dependents: client.dependents,
      householdIncome: client.householdIncome,
      employmentStatus: client.employmentStatus,
      monthlyBudget: client.monthlyBudget,
      coverageGoals: client.coverageGoals,
      interestedProducts: client.interestedProducts,
      primaryConcern: client.primaryConcern,
      hasExistingCoverage: client.hasExistingCoverage,
      existingCarrier: client.existingCarrier,
      eligibleProducts: eligibility.eligibleProducts.map((p) => ({
        name: p.productName,
        category: p.category,
        carrier: p.carrierName,
        essentialPrice:
          p.pricing.find((pr) => pr.tier === "ESSENTIAL")?.monthlyAmount ?? 0,
        comprehensivePrice:
          p.pricing.find((pr) => pr.tier === "COMPREHENSIVE")?.monthlyAmount ?? 0,
        maximumPrice:
          p.pricing.find((pr) => pr.tier === "MAXIMUM")?.monthlyAmount ?? 0,
      })),
      ineligibleProducts: eligibility.ineligibleProducts.map((p) => ({
        name: p.productName,
        reason: p.reason,
      })),
      scenarios: {
        routineCare: {
          withoutCoverage: scenarios.routineCare.estimatedCostWithoutCoverage,
          withEssential: scenarios.routineCare.estimatedCostWithEssential,
          withMaximum: scenarios.routineCare.estimatedCostWithMaximum,
          savings: scenarios.routineCare.potentialSavings,
        },
        emergencyRoom: {
          withoutCoverage: scenarios.emergencyRoom.estimatedCostWithoutCoverage,
          withEssential: scenarios.emergencyRoom.estimatedCostWithEssential,
          withMaximum: scenarios.emergencyRoom.estimatedCostWithMaximum,
          savings: scenarios.emergencyRoom.potentialSavings,
        },
        criticalIllness: {
          withoutCoverage: scenarios.criticalIllness.estimatedCostWithoutCoverage,
          withEssential: scenarios.criticalIllness.estimatedCostWithEssential,
          withMaximum: scenarios.criticalIllness.estimatedCostWithMaximum,
          savings: scenarios.criticalIllness.potentialSavings,
        },
        recommendedTier: scenarios.summary.recommendedTier,
      },
      bundles: {
        essential: {
          monthlyTotal: bundles.essential.monthlyTotal,
          description: bundles.essential.description,
        },
        comprehensive: {
          monthlyTotal: bundles.comprehensive.monthlyTotal,
          description: bundles.comprehensive.description,
        },
        maximum: {
          monthlyTotal: bundles.maximum.monthlyTotal,
          description: bundles.maximum.description,
        },
      },
    });

    await delay(AI_CALL_DELAY_MS);
    return narrative;
  } catch (error) {
    console.warn("AI narrative failed, using template fallback:", error);
    return generateNarrativeTemplate(client, eligibility, scenarios, bundles);
  }
}

/**
 * Small delay helper to avoid rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Template-based fallback risk summary (used when AI is unavailable)
 */
export function generateRiskSummaryTemplate(
  client: NormalizedClient,
  eligibility: EligibilityResult,
  scenarios: ScenarioProjections
): string {
  const healthRisk = calculateHealthRisk(client.healthConditions);
  const totalEligible = eligibility.eligibleProducts.length;
  const totalIneligible = eligibility.ineligibleProducts.length;

  const riskAdjectives: Record<string, string> = {
    LOW: "minimal",
    MODERATE: "moderate",
    HIGH: "elevated",
    SEVERE: "significant",
  };

  const ageRisk = client.age > 55 ? "higher" : "standard";
  const tobaccoRisk = client.tobaccoUser ? "increased due to tobacco use" : "standard";

  return [
    `Based on the analysis, ${client.healthConditions.length > 0 ? `you have ${client.healthConditions.length} reported health condition(s) indicating **${riskAdjectives[healthRisk]}** health risk. ` : "you reported no significant health conditions, indicating **minimal** health risk. "}`,
    `At age ${client.age}, you fall into the **${ageRisk}** risk category for insurance pricing.`,
    `Your tobacco use status (${client.tobaccoUser ? "tobacco user" : "non-tobacco user"}) puts you at **${tobaccoRisk}** risk rating.`,
    `We identified **${totalEligible}** eligible product(s) across ${new Set(eligibility.eligibleProducts.map((p) => p.carrierName)).size} carrier(s) for your profile.`,
    totalIneligible > 0 ? `${totalIneligible} product(s) were not available based on your age, location, or profile.` : "",
    `The largest financial exposure is in the **${scenarios.criticalIllness.label}** scenario, with potential costs up to **${scenarios.criticalIllness.estimatedCostWithoutCoverage.toLocaleString()}** without proper coverage.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Template-based fallback narrative (used when AI is unavailable)
 */
export function generateNarrativeTemplate(
  client: NormalizedClient,
  eligibility: EligibilityResult,
  scenarios: ScenarioProjections,
  bundles: BundleRecommendations
): string {
  const healthRisk = calculateHealthRisk(client.healthConditions);

  return [
    `# Financial Protection Analysis for ${client.healthConditions.length > 0 ? "At-Risk Profile" : "Standard Profile"}`,
    "",
    "## Your Coverage Landscape",
    `You are a ${client.age}-year-old ${client.gender?.toLowerCase() || "individual"} in ${client.state} with ${client.dependents > 0 ? `${client.dependents} dependent(s)` : "no dependents"}. `,
    client.hasExistingCoverage
      ? `You currently have coverage${client.existingCarrier ? ` through ${client.existingCarrier}` : ""}.`
      : "You currently do not have health coverage in place.",
    client.monthlyBudget
      ? `Your estimated monthly budget for protection is **${client.monthlyBudget}**.`
      : "",
    "",
    "## Health Risk Profile",
    client.healthConditions.length > 0
      ? `You reported the following condition(s): **${client.healthConditions.join(", ")}**. These indicate **${healthRisk}** health risk.`
      : "You reported no pre-existing conditions, indicating low baseline health risk.",
    client.tobaccoUser
      ? "Tobacco use is a significant rating factor that increases premium costs across most product categories."
      : "Non-tobacco user status qualifies you for preferred pricing on most products.",
    "",
    "## Financial Exposure Analysis",
    "### Routine Care",
    `Without coverage: **${scenarios.routineCare.estimatedCostWithoutCoverage.toLocaleString()}/year**`,
    `With Essential: **${scenarios.routineCare.estimatedCostWithEssential.toLocaleString()}/year**`,
    `With Maximum: **${scenarios.routineCare.estimatedCostWithMaximum.toLocaleString()}/year**`,
    `**Savings: Up to ${scenarios.routineCare.potentialSavings.toLocaleString()}/year**`,
    "",
    "### Emergency Room Visit",
    `Without coverage: **${scenarios.emergencyRoom.estimatedCostWithoutCoverage.toLocaleString()}**`,
    `With Essential: **${scenarios.emergencyRoom.estimatedCostWithEssential.toLocaleString()}**`,
    `With Maximum: **${scenarios.emergencyRoom.estimatedCostWithMaximum.toLocaleString()}**`,
    `**Savings: Up to ${scenarios.emergencyRoom.potentialSavings.toLocaleString()}**`,
    "",
    "### Critical Illness Event",
    `Without coverage: **${scenarios.criticalIllness.estimatedCostWithoutCoverage.toLocaleString()}**`,
    `With Essential: **${scenarios.criticalIllness.estimatedCostWithEssential.toLocaleString()}**`,
    `With Maximum: **${scenarios.criticalIllness.estimatedCostWithMaximum.toLocaleString()}**`,
    `**Savings: Up to ${scenarios.criticalIllness.potentialSavings.toLocaleString()}**`,
    "",
    "## Recommended Protection Plan",
    `Based on your profile and budget, we recommend the **${bundles.comprehensive.name}** plan at **${bundles.comprehensive.monthlyTotal.toFixed(2)}/month**.`,
    "",
    "### Bundle Options",
    `**Essential (${bundles.essential.monthlyTotal.toFixed(2)}/mo):** ${bundles.essential.description}`,
    `**Comprehensive (${bundles.comprehensive.monthlyTotal.toFixed(2)}/mo):** ${bundles.comprehensive.description}`,
    `**Maximum (${bundles.maximum.monthlyTotal.toFixed(2)}/mo):** ${bundles.maximum.description}`,
    "",
    "### Coverage Highlights",
    ...bundles.comprehensive.products.map(
      (p) => `- **${p.productName}** (${p.carrierName}): ${p.monthlyAmount.toFixed(2)}/mo`
    ),
    "",
    "## Important Notice",
    "*This analysis is for illustrative purposes only. Actual rates, eligibility, and coverage terms are determined by carriers during formal underwriting. The projections shown are estimates based on general industry data and should not be considered a guarantee of coverage or pricing. Consult with your licensed agent for personalized quotes.*",
  ].join("\n");
}

// ─── 6. MAIN ANALYSIS ORCHESTRATOR ─────────────────────────────

/**
 * Run the complete analysis pipeline for a client profile.
 * This is the main entry point that the API route calls.
 */
export async function runAnalysis(
  profileId: string,
  agentId: string
): Promise<AnalysisOutput> {
  // Fetch the client profile with all related data
  const profile = await prisma.clientProfile.findUnique({
    where: { id: profileId },
    include: {
      intakeToken: {
        include: {
          agent: {
            select: { id: true, name: true, state: true },
          },
        },
      },
    },
  });

  if (!profile) {
    throw new Error(`Profile ${profileId} not found`);
  }

  const agentState = profile.intakeToken.agent.state || "CA";

  // Step 1: Normalize
  const client = normalizeClientProfile({
    ...profile,
    state: agentState,
  });

  // Step 2: Eligibility
  const eligibility = await determineEligibility(client, agentId);

  // Step 3: Scenario calculations
  const scenarios = calculateScenarios(client, eligibility.eligibleProducts);

  // Step 4: Bundle recommendations
  const bundles = generateBundles(eligibility.eligibleProducts, client, scenarios);

  // Step 5: Generate AI-powered narrative
  const riskSummary = await generateRiskSummary(client, eligibility, scenarios);
  const narrative = await generateNarrative(client, eligibility, scenarios, bundles);

  return {
    clientName: `${profile.firstName} ${profile.lastName}`,
    clientAge: client.age,
    clientState: client.state,
    generatedAt: new Date().toISOString(),
    riskSummary,
    narrative,
    eligibility,
    scenarios,
    bundles,
  };
}

/**
 * Persist analysis output to database
 */
export async function saveAnalysis(
  profileId: string,
  agentId: string,
  output: AnalysisOutput,
  pdfUrl?: string | null
) {
  return prisma.analysisReport.upsert({
    where: { clientProfileId: profileId },
    update: {
      status: "COMPLETE",
      eligibleProducts: JSON.parse(JSON.stringify(output.eligibility.eligibleProducts)),
      ineligibleProducts: JSON.parse(JSON.stringify(output.eligibility.ineligibleProducts)),
      scenarios: JSON.parse(JSON.stringify(output.scenarios)),
      bundles: JSON.parse(JSON.stringify(output.bundles)),
      riskSummary: output.riskSummary,
      narrative: output.narrative,
      reportPdfUrl: pdfUrl,
      generatedAt: new Date(),
    },
    create: {
      clientProfileId: profileId,
      agentId,
      status: "COMPLETE",
      eligibleProducts: JSON.parse(JSON.stringify(output.eligibility.eligibleProducts)),
      ineligibleProducts: JSON.parse(JSON.stringify(output.eligibility.ineligibleProducts)),
      scenarios: JSON.parse(JSON.stringify(output.scenarios)),
      bundles: JSON.parse(JSON.stringify(output.bundles)),
      riskSummary: output.riskSummary,
      narrative: output.narrative,
      reportPdfUrl: pdfUrl,
      generatedAt: new Date(),
    },
  });
}

/**
 * Generate and save a complete analysis in one call
 */
export async function generateAndSaveAnalysis(
  profileId: string,
  agentId: string
) {
  try {
    const output = await runAnalysis(profileId, agentId);
    
    // Generate PDF and upload to storage
    let pdfUrl: string | null = null;
    try {
      const pdfBuffer = await generatePdf({
        ...output,
        eligibleProducts: output.eligibility.eligibleProducts,
      });
      if (pdfBuffer) {
        pdfUrl = await uploadReportPdf(profileId, pdfBuffer);
      }
    } catch (pdfError) {
      console.error("Failed to generate or upload PDF during analysis save:", pdfError);
    }

    await saveAnalysis(profileId, agentId, output, pdfUrl);
    return { ...output, reportPdfUrl: pdfUrl };
  } catch (error) {
    // Save error state
    await prisma.analysisReport.upsert({
      where: { clientProfileId: profileId },
      update: {
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      create: {
        clientProfileId: profileId,
        agentId,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}