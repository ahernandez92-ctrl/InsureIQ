"use client";

import { IntakePageProps } from "../types";

export default function Step2Household({ formData, updateFormData, goNext, goBack }: IntakePageProps) {
  const { maritalStatus, dependents, householdIncome } = formData.step2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Household Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your household to help find the right coverage.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Marital Status</label>
        <select
          value={maritalStatus}
          onChange={(e) => updateFormData("step2", { maritalStatus: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select...</option>
          <option value="SINGLE">Single</option>
          <option value="MARRIED">Married</option>
          <option value="DIVORCED">Divorced</option>
          <option value="WIDOWED">Widowed</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Dependents</label>
        <input
          type="number"
          min={0}
          max={20}
          value={dependents}
          onChange={(e) => updateFormData("step2", { dependents: parseInt(e.target.value) || 0 })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Annual Household Income</label>
        <select
          value={householdIncome}
          onChange={(e) => updateFormData("step2", { householdIncome: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select range...</option>
          <option value="UNDER_25K">Under $25,000</option>
          <option value="25K_50K">$25,000 - $50,000</option>
          <option value="50K_75K">$50,000 - $75,000</option>
          <option value="75K_100K">$75,000 - $100,000</option>
          <option value="100K_150K">$100,000 - $150,000</option>
          <option value="150K_250K">$150,000 - $250,000</option>
          <option value="OVER_250K">Over $250,000</option>
        </select>
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