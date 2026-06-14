"use client";

import { IntakePageProps } from "../types";

export default function Step1Personal({ formData, updateFormData, goNext }: IntakePageProps) {
  const { firstName, lastName, email, phone, dateOfBirth, gender } = formData.step1;

  const isValid = firstName && lastName && email;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s start with some basic details about you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => updateFormData("step1", { firstName: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => updateFormData("step1", { lastName: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => updateFormData("step1", { email: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => updateFormData("step1", { phone: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => updateFormData("step1", { dateOfBirth: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Gender</label>
          <select
            value={gender}
            onChange={(e) => updateFormData("step1", { gender: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={goNext}
          disabled={!isValid}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}