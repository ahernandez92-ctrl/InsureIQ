"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { IntakeProvider, useIntake } from "@/components/intake/intake-context";
import StepIndicator from "@/components/intake/step-indicator";
import Step1Personal from "@/components/intake/steps/step-1-personal";
import Step2Household from "@/components/intake/steps/step-2-household";
import Step3Financial from "@/components/intake/steps/step-3-financial";
import Step4Health from "@/components/intake/steps/step-4-health";
import Step5Coverage from "@/components/intake/steps/step-5-coverage";
import Step6Confirmation from "@/components/intake/steps/step-6-confirmation";

const STEP_LABELS = [
  "Personal Info",
  "Household",
  "Financial",
  "Health",
  "Coverage",
  "Confirm",
];

function IntakeWizard() {
  const {
    currentStep,
    status,
    errorMessage,
    formData,
    updateFormData,
    goNext,
    goBack,
    setToken,
    setStatus,
    setAgentName,
    setErrorMessage,
  } = useIntake();
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    if (token) {
      setToken(token);
      fetch(`/api/intake/${token}`)
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json();
            if (res.status === 410) {
              setStatus("expired");
              setErrorMessage(err.message);
            } else {
              setStatus("error");
              setErrorMessage(err.message);
            }
            return;
          }
          const data = await res.json();
          setStatus("valid");
          if (data.agentName) setAgentName(data.agentName);
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage("Unable to verify intake link");
        });
    }
  }, [token, setToken, setStatus, setAgentName, setErrorMessage]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Verifying your link...</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8">
          <h2 className="mb-2 text-xl font-semibold text-amber-800">Link Expired</h2>
          <p className="text-amber-700">{errorMessage}</p>
          <p className="mt-4 text-sm text-amber-600">
            Please contact your insurance agent for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Invalid Link</h2>
          <p className="text-red-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-semibold text-green-800">
            Information Submitted!
          </h2>
          <p className="text-green-700">
            Thank you! Your information has been securely submitted to your agent.
            They will be in touch with personalized insurance recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Insurance Needs Assessment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us find the right coverage for you
        </p>
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={6} labels={STEP_LABELS} />

      <div className="rounded-lg border p-6">
        {currentStep === 1 && (
          <Step1Personal
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
        {currentStep === 2 && (
          <Step2Household
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
        {currentStep === 3 && (
          <Step3Financial
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
        {currentStep === 4 && (
          <Step4Health
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
        {currentStep === 5 && (
          <Step5Coverage
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
        {currentStep === 6 && (
          <Step6Confirmation
            formData={formData}
            updateFormData={updateFormData}
            goNext={goNext}
            goBack={goBack}
            status={status}
          />
        )}
      </div>
    </div>
  );
}

export default function IntakePage() {
  return (
    <IntakeProvider>
      <IntakeWizard />
    </IntakeProvider>
  );
}