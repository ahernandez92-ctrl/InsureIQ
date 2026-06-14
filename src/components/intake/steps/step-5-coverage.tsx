"use client";

import { IntakePageProps } from "../types";

const PRODUCT_OPTIONS = [
  { value: "LIFE", label: "Life Insurance" },
  { value: "HEALTH", label: "Health Insurance" },
  { value: "CI", label: "Critical Illness" },
  { value: "ACCIDENT", label: "Accident Insurance" },
  { value: "HOSPITAL", label: "Hospital Indemnity" },
  { value: "DISABILITY", label: "Disability Insurance" },
];

const GOAL_OPTIONS = [
  { value: "LOWER_COST", label: "Lower monthly premiums" },
  { value: "BETTER_COVERAGE", label: "Better coverage/benefits" },
  { value: "FAMILY_PROTECTION", label: "Protecting my family" },
  { value: "RETIREMENT", label: "Retirement planning" },
  { value: "DEBT_PROTECTION", label: "Debt/income protection" },
  { value: "SUPPLEMENT", label: "Supplement existing coverage" },
];

export default function Step5Coverage({ formData, updateFormData, goNext, goBack }: IntakePageProps) {
  const { coverageGoals, interestedProducts, primaryConcern } = formData.step5;

  const selectedProducts = interestedProducts ? interestedProducts.split(",").filter(Boolean) : [];
  const selectedGoals = coverageGoals ? coverageGoals.split(",").filter(Boolean) : [];

  function toggleProduct(value: string) {
    const current = new Set(selectedProducts);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    updateFormData("step5", { interestedProducts: Array.from(current).join(",") });
  }

  function toggleGoal(value: string) {
    const current = new Set(selectedGoals);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    updateFormData("step5", { coverageGoals: Array.from(current).join(",") });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Coverage Priorities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What matters most to you in your insurance coverage?
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Insurance Products You&apos;re Interested In</label>
        <div className="grid gap-2 md:grid-cols-2">
          {PRODUCT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleProduct(opt.value)}
              className={`rounded-md border px-4 py-2 text-left text-sm transition-colors ${
                selectedProducts.includes(opt.value)
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Your Coverage Goals</label>
        <div className="grid gap-2 md:grid-cols-2">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleGoal(opt.value)}
              className={`rounded-md border px-4 py-2 text-left text-sm transition-colors ${
                selectedGoals.includes(opt.value)
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Primary Concern</label>
        <textarea
          value={primaryConcern}
          onChange={(e) => updateFormData("step5", { primaryConcern: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={2}
          placeholder="What's your biggest concern about your insurance coverage?"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={goBack}
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-secondary"
        >
          Back
        </button>
        <button
          onClick={goNext}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}