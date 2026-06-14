"use client";

import { IntakePageProps } from "../types";
import { useIntake } from "../intake-context";

export default function Step6Confirmation({ formData, updateFormData, goBack }: IntakePageProps) {
  const { submitting, agentName } = useIntake();
  const { consented, signature } = formData.step6;
  const { submitForm } = useIntake();

  const isValid = consented && signature;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review & Confirm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review your information and provide consent.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Summary</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Name:</strong> {formData.step1.firstName} {formData.step1.lastName}</p>
          <p><strong>Email:</strong> {formData.step1.email}</p>
          <p><strong>Products of Interest:</strong> {formData.step5.interestedProducts || "None selected"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={consented}
            onChange={(e) => updateFormData("step6", { consented: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed">
            I consent to {agentName || "my insurance agent"} using this information to
            provide insurance quotes and recommendations. I understand that this is a
            request for information and not a binding application.
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Electronic Signature</label>
        <p className="text-xs text-muted-foreground">
          Type your full name as your electronic signature
        </p>
        <input
          type="text"
          value={signature}
          onChange={(e) => updateFormData("step6", { signature: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type your full name"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={goBack}
          disabled={submitting}
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={submitForm}
          disabled={!isValid || submitting}
          className="rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit My Information"}
        </button>
      </div>
    </div>
  );
}