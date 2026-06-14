"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step === currentStep
                    ? "border-2 border-primary bg-primary/10 text-primary"
                    : "border-2 border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              <span
                className={`mt-1 hidden text-xs md:block ${
                  step <= currentStep ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {labels[step - 1]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`mx-2 h-0.5 w-8 md:w-12 ${
                  step < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground md:hidden">
        Step {currentStep} of {totalSteps}: {labels[currentStep - 1]}
      </p>
    </div>
  );
}