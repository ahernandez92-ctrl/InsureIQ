import { IntakeStatus } from "./intake-context";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

export interface HouseholdInfo {
  maritalStatus: string;
  dependents: number;
  householdIncome: string;
}

export interface FinancialInfo {
  employmentStatus: string;
  employerName: string;
  hasExistingCoverage: boolean;
  existingCarrier: string;
  monthlyBudget: string;
}

export interface HealthInfo {
  healthConditions: string;
  medications: string;
  tobaccoUser: boolean;
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
}

export interface CoverageInfo {
  coverageGoals: string;
  interestedProducts: string;
  primaryConcern: string;
}

export interface ConfirmationInfo {
  consented: boolean;
  signature: string;
}

export interface IntakeFormData {
  step1: PersonalInfo;
  step2: HouseholdInfo;
  step3: FinancialInfo;
  step4: HealthInfo;
  step5: CoverageInfo;
  step6: ConfirmationInfo;
}

export const defaultFormData: IntakeFormData = {
  step1: { firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", gender: "" },
  step2: { maritalStatus: "", dependents: 0, householdIncome: "" },
  step3: { employmentStatus: "", employerName: "", hasExistingCoverage: false, existingCarrier: "", monthlyBudget: "" },
  step4: { healthConditions: "", medications: "", tobaccoUser: false, heightFeet: "", heightInches: "", weightLbs: "" },
  step5: { coverageGoals: "", interestedProducts: "", primaryConcern: "" },
  step6: { consented: false, signature: "" },
};

export interface IntakePageProps {
  formData: IntakeFormData;
  updateFormData: (step: keyof IntakeFormData, data: Partial<IntakeFormData[keyof IntakeFormData]>) => void;
  goNext: () => void;
  goBack: () => void;
  status: IntakeStatus;
}