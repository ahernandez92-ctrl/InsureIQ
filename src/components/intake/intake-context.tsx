"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IntakeFormData, defaultFormData } from "./types";

export type IntakeStatus = "loading" | "valid" | "completed" | "expired" | "error";

interface IntakeContextType {
  currentStep: number;
  formData: IntakeFormData;
  status: IntakeStatus;
  token: string;
  agentName: string;
  errorMessage: string;
  setToken: (token: string) => void;
  setAgentName: (name: string) => void;
  setStatus: (status: IntakeStatus) => void;
  setErrorMessage: (msg: string) => void;
  goToStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  updateFormData: (step: keyof IntakeFormData, data: Partial<IntakeFormData[keyof IntakeFormData]>) => void;
  submitForm: () => Promise<void>;
  submitting: boolean;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntakeFormData>(defaultFormData);
  const [status, setStatus] = useState<IntakeStatus>("loading");
  const [token, setToken] = useState("");
  const [agentName, setAgentName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateFormData = useCallback(
    (step: keyof IntakeFormData, data: Partial<IntakeFormData[keyof IntakeFormData]>) => {
      setFormData((prev) => ({
        ...prev,
        [step]: { ...prev[step], ...data },
      }));
    },
    []
  );

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 6)));
  }, []);

  const submitForm = useCallback(async () => {
    setSubmitting(true);
    try {
      const body = {
        firstName: formData.step1.firstName,
        lastName: formData.step1.lastName,
        email: formData.step1.email,
        phone: formData.step1.phone || null,
        dateOfBirth: formData.step1.dateOfBirth ? new Date(formData.step1.dateOfBirth) : null,
        gender: formData.step1.gender || null,
        maritalStatus: formData.step2.maritalStatus || null,
        dependents: formData.step2.dependents || 0,
        householdIncome: formData.step2.householdIncome || null,
        employmentStatus: formData.step3.employmentStatus || null,
        employerName: formData.step3.employerName || null,
        hasExistingCoverage: formData.step3.hasExistingCoverage,
        existingCarrier: formData.step3.existingCarrier || null,
        monthlyBudget: formData.step3.monthlyBudget ? parseFloat(formData.step3.monthlyBudget) : null,
        healthConditions: formData.step4.healthConditions || null,
        medications: formData.step4.medications || null,
        tobaccoUser: formData.step4.tobaccoUser || null,
        heightFeet: formData.step4.heightFeet ? parseInt(formData.step4.heightFeet) : null,
        heightInches: formData.step4.heightInches ? parseInt(formData.step4.heightInches) : null,
        weightLbs: formData.step4.weightLbs ? parseInt(formData.step4.weightLbs) : null,
        coverageGoals: formData.step5.coverageGoals || null,
        interestedProducts: formData.step5.interestedProducts || null,
        primaryConcern: formData.step5.primaryConcern || null,
        consented: formData.step6.consented,
        signature: formData.step6.signature || null,
      };

      const res = await fetch(`/api/intake/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }

      setStatus("completed");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }, [formData, token]);

  return (
    <IntakeContext.Provider
      value={{
        currentStep,
        formData,
        status,
        token,
        agentName,
        errorMessage,
        setToken,
        setAgentName,
        setStatus,
        setErrorMessage,
        goToStep,
        goNext,
        goBack,
        updateFormData,
        submitForm,
        submitting,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error("useIntake must be used within an IntakeProvider");
  }
  return context;
}