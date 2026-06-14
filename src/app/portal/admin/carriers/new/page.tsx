"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCarrierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
    };

    try {
      const res = await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to create carrier");
        setLoading(false);
        return;
      }

      router.push("/portal/admin/carriers");
      router.refresh();
    } catch {
      setError("An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Carrier</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new insurance carrier to your portfolio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Carrier Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., Aetna, Cigna, Humana"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Carrier Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., AETNA, CIGNA"
          />
          <p className="text-xs text-muted-foreground">
            A unique identifier used in data imports
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Carrier"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md border px-6 py-2 text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}