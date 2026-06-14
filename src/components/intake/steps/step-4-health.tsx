"use client";

import { IntakePageProps } from "../types";

export default function Step4Health({ formData, updateFormData, goNext, goBack }: IntakePageProps) {
  const { healthConditions, medications, tobaccoUser, heightFeet, heightInches, weightLbs } = formData.step4;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Health Background</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This information helps us find plans that fit your health needs.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pre-existing Conditions</label>
        <textarea
          value={healthConditions}
          onChange={(e) => updateFormData("step4", { healthConditions: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={3}
          placeholder="List any pre-existing conditions (e.g., diabetes, asthma, high blood pressure)"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Current Medications</label>
        <input
          type="text"
          value={medications}
          onChange={(e) => updateFormData("step4", { medications: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="List current medications"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tobaccoUser"
          checked={tobaccoUser}
          onChange={(e) => updateFormData("step4", { tobaccoUser: e.target.checked })}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <label htmlFor="tobaccoUser" className="text-sm font-medium">
          I use tobacco or nicotine products
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Height (feet)</label>
          <input
            type="number"
            min={3}
            max={8}
            value={heightFeet}
            onChange={(e) => updateFormData("step4", { heightFeet: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="5"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Height (inches)</label>
          <input
            type="number"
            min={0}
            max={11}
            value={heightInches}
            onChange={(e) => updateFormData("step4", { heightInches: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Weight (lbs)</label>
          <input
            type="number"
            min={50}
            max={500}
            value={weightLbs}
            onChange={(e) => updateFormData("step4", { weightLbs: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="180"
          />
        </div>
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