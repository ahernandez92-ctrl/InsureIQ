/**
 * HealthSherpa API Integration
 *
 * HealthSherpa provides individual & family health insurance quoting APIs.
 * This module handles secure storage, retrieval, and API communication.
 *
 * Two key modes:
 * 1. Environment-level: HEALTHSHERPA_API_KEY in .env (system-wide quoting)
 * 2. Agent-level: Stored per-agent in the database (custom integration)
 */

const HEALTHSHERPA_BASE_URL = "https://api.healthsherpa.com/v1";

export interface HealthSherpaConfig {
  apiKey: string;
  sandbox?: boolean;
}

export interface HealthSherpaPlan {
  id: string;
  carrier: string;
  carrier_id: string;
  name: string;
  metal_level: string; // BRONZE, SILVER, GOLD, PLATINUM, CATASTROPHIC
  premium: number;
  deductible: number;
  out_of_pocket_max: number;
  network: string;
  plan_type: string; // HMO, PPO, EPO, POS
  is_active: boolean;
}

export interface HealthSherpaQuoteRequest {
  state: string;
  zip_code: string;
  age: number;
  gender: string;
  tobacco_use: boolean;
  income: number;
  household_size: number;
}

export interface HealthSherpaQuoteResponse {
  plans: HealthSherpaPlan[];
  total_count: number;
  lowest_premium: number;
  highest_premium: number;
}

/**
 * Get the system-level HealthSherpa API key from environment variables
 */
export function getSystemApiKey(): string | null {
  return process.env.HEALTHSHERPA_API_KEY || null;
}

/**
 * Get the best available API config — preference: agent key > system key
 */
export function getBestApiConfig(agentKey?: string | null): HealthSherpaConfig | null {
  const key = agentKey || getSystemApiKey();
  if (!key) return null;
  return { apiKey: key, sandbox: process.env.NODE_ENV === "development" };
}

/**
 * Create headers for HealthSherpa API requests
 */
function getHeaders(config: HealthSherpaConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "X-API-Version": "2024-01",
    ...(config.sandbox ? { "X-Sandbox": "true" } : {}),
  };
}

/**
 * Fetch available plans for a given quote request
 */
export async function fetchPlans(
  config: HealthSherpaConfig,
  request: HealthSherpaQuoteRequest
): Promise<HealthSherpaQuoteResponse> {
  const params = new URLSearchParams({
    state: request.state,
    zip_code: request.zip_code,
    age: String(request.age),
    gender: request.gender,
    tobacco_use: String(request.tobacco_use),
    income: String(request.income),
    household_size: String(request.household_size),
  });

  const response = await fetch(
    `${HEALTHSHERPA_BASE_URL}/plans?${params.toString()}`,
    { headers: getHeaders(config) }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `HealthSherpa API error: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
}

/**
 * Fetch plans from HealthSherpa using the system API key
 */
export async function fetchPlansWithSystemKey(
  request: HealthSherpaQuoteRequest
): Promise<HealthSherpaQuoteResponse> {
  const apiKey = getSystemApiKey();
  if (!apiKey) {
    throw new Error(
      "HEALTHSHERPA_API_KEY is not configured in environment variables"
    );
  }
  return fetchPlans({ apiKey }, request);
}

/**
 * Verify that an API key is valid by making a small test request
 */
export async function verifyApiKey(
  config: HealthSherpaConfig
): Promise<boolean> {
  try {
    const response = await fetch(`${HEALTHSHERPA_BASE_URL}/plans?limit=1`, {
      headers: getHeaders(config),
      method: "GET",
    });
    // 200 = auth OK with results. 422 = auth OK but params invalid (still valid key)
    return response.ok || response.status === 422;
  } catch {
    return false;
  }
}

/**
 * Verify the system-level API key
 */
export async function verifySystemApiKey(): Promise<boolean> {
  const apiKey = getSystemApiKey();
  if (!apiKey) return false;
  return verifyApiKey({ apiKey });
}

/**
 * Format a premium amount as a display string (cents to dollars)
 */
export function formatPremium(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get a human-readable metal level label
 */
export function getMetalLevelLabel(metalLevel: string): string {
  const labels: Record<string, string> = {
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
    CATASTROPHIC: "Catastrophic",
  };
  return labels[metalLevel] || metalLevel;
}

/**
 * Convert HealthSherpa plan data to a standardized product code
 */
export function planToProductCode(plan: HealthSherpaPlan): string {
  const carrierCode = (plan.carrier_id || plan.carrier)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");
  return `${carrierCode}_${plan.plan_type}_${plan.metal_level}`;
}

/**
 * Get a representative sample quote request for syncing
 */
export function getSampleQuoteRequest(
  state: string = "CA"
): HealthSherpaQuoteRequest {
  return {
    state,
    zip_code: "90210",
    age: 35,
    gender: "MALE",
    tobacco_use: false,
    income: 50000,
    household_size: 1,
  };
}