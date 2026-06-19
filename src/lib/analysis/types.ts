/**
 * InsureIQ AI Analysis Engine - Type Definitions
 *
 * These types define the full analysis output including normalization,
 * eligibility filtering, scenario projections, and bundle recommendations.
 */

// ─── Normalized Client Profile ──────────────────────────────────
export interface NormalizedClient {
  age: number;
  state: string;
  gender: "MALE" | "FEMALE" | null;
  tobaccoUser: boolean;
  dependents: number;
  householdIncome: string | null;
  employmentStatus: string | null;
  hasExistingCoverage: boolean;
  existingCarrier: string | null;
  monthlyBudget: number | null;
  healthConditions: string[];
  medications: string;
  coverageGoals: string[];
  interestedProducts: string[];
  primaryConcern: string | null;
}

// ─── Eligibility Result ─────────────────────────────────────────
export interface EligibilityResult {
  eligibleProducts: EligibleProduct[];
  ineligibleProducts: IneligibleProduct[];
}

export interface EligibleProduct {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  carrierName: string;
  carrierCode: string;
  pricing: ProductPriceOption[];
}

export interface ProductPriceOption {
  tier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM";
  amount: number;
  monthlyAmount: number;
}

export interface IneligibleProduct {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  carrierName: string;
  reason: string;
}

// ─── Scenario Projections ───────────────────────────────────────
export interface ScenarioProjections {
  routineCare: ScenarioDetail;
  emergencyRoom: ScenarioDetail;
  criticalIllness: ScenarioDetail;
  summary: ScenarioSummary;
}

export interface ScenarioDetail {
  label: string;
  description: string;
  estimatedCostWithoutCoverage: number;
  estimatedCostWithEssential: number;
  estimatedCostWithComprehensive: number;
  estimatedCostWithMaximum: number;
  potentialSavings: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
}

export interface ScenarioSummary {
  totalPotentialSavings: number;
  recommendedTier: "ESSENTIAL" | "COMPREHENSIVE" | "MAXIMUM";
  monthlyInvestment: number;
  annualInvestment: number;
}

// ─── Bundle Recommendations ─────────────────────────────────────
export interface BundleRecommendations {
  essential: Bundle;
  comprehensive: Bundle;
  maximum: Bundle;
}

export interface Bundle {
  name: string;
  description: string;
  products: BundleProduct[];
  monthlyTotal: number;
  annualTotal: number;
  coverageHighlights: string[];
}

export interface BundleProduct {
  productId: string;
  productName: string;
  carrierName: string;
  tier: string;
  monthlyAmount: number;
}

// ─── Full Analysis Output ───────────────────────────────────────
export interface AnalysisOutput {
  clientName: string;
  clientAge: number;
  clientState: string;
  generatedAt: string;
  riskSummary: string;
  narrative: string;
  eligibility: EligibilityResult;
  scenarios: ScenarioProjections;
  bundles: BundleRecommendations;
  eligibleProducts: EligibleProduct[];
}

// ─── Cost Constants (default national averages) ─────────────────
export const COST_CONSTANTS = {
  // Routine Care (annual)
  ROUTINE_DOCTOR_VISIT: 150,       // Per visit
  ROUTINE_VISITS_PER_YEAR: 3,
  ROUTINE_PRESCRIPTIONS_MONTHLY: 50,
  ROUTINE_PREVENTIVE: 300,         // Annual preventive care

  // Emergency Room (per incident)
  ER_VISIT_COST: 2750,             // Average ER visit cost
  ER_AMBULANCE: 1200,
  ER_DIAGNOSTICS: 850,
  ER_FOLLOW_UP: 350,

  // Critical Illness (one-time event)
  CI_HOSPITALIZATION_DAILY: 5200,
  CI_HOSPITAL_DAYS: 5,
  CI_SURGERY: 15000,
  CI_POST_OP_CARE: 6000,
  CI_LOST_INCOME_MONTHS: 3,
  CI_MONTHLY_INCOME_REPLACEMENT: 5000,
} as const;

// ─── Health Condition Risk Weights ──────────────────────────────
export const CONDITION_RISK_WEIGHTS: Record<string, "LOW" | "MODERATE" | "HIGH" | "SEVERE"> = {
  DIABETES: "HIGH",
  HEART_DISEASE: "SEVERE",
  CANCER: "SEVERE",
  ASTHMA: "MODERATE",
  HIGH_BLOOD_PRESSURE: "HIGH",
  HIGH_CHOLESTEROL: "MODERATE",
  OBESITY: "MODERATE",
  ARTHRITIS: "MODERATE",
  DEPRESSION: "LOW",
  ANXIETY: "LOW",
  THYROID_DISORDER: "MODERATE",
  KIDNEY_DISEASE: "SEVERE",
  LIVER_DISEASE: "SEVERE",
  COPD: "SEVERE",
};