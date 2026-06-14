"use client";

import { IntakePageProps } from "../types";

export default function Step3Financial({ formData, updateFormData, goNext, goBack }: IntakePageProps) {
  const { employmentStatus, employerName, hasExistingCoverage, existingCarrier, monthlyBudget } = formData.step3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Financial Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand your financial situation and current coverage.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Employment Status</label>
        <select
          value={employmentStatus}
          onChange={(e) => updateFormData("step3", { employmentStatus: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select...</option>
          <option value="EMPLOYED">Employed</option>
          <option value="SELF_EMPLOYED">Self-Employed</option>
          <option value="UNEMPLOYED">Unemployed</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Employer Name</label>
        <input
          type="text"
          value={employerName}
          onChange={(e) => updateFormData("step3", { employerName: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Company name (if applicable)"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="existingCoverage"
          checked={hasExistingCoverage}
          onChange={(e) => updateFormData("step3", { hasExistingCoverage: e.target.checked })}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <label htmlFor="existingCoverage" className="text-sm font-medium">
          I currently have health insurance coverage
        </label>
      </div>

      {hasExistingCoverage && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Insurance Carrier</label>
          <input
            type="text"
            value={existingCarrier}
            onChange={(e) => updateFormData("step3", { existingCarrier: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g., Blue Cross, Aetna"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Monthly Budget for Insurance ($)</label>
        <input
          type="number"
          min={0}
          step={10}
          value={monthlyBudget}
          onChange={(e) => updateFormData("step3", { monthlyBudget: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="200"
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