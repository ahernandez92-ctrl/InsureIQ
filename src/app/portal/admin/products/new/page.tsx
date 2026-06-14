"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCarrierId = searchParams.get("carrierId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carriers, setCarriers] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        const res = await fetch("/api/carriers");
        if (res.ok) {
          const data = await res.json();
          setCarriers(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingCarriers(false);
      }
    }
    fetchCarriers();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      carrierId: formData.get("carrierId") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to create product");
        setLoading(false);
        return;
      }

      router.push("/portal/admin/products");
      router.refresh();
    } catch {
      setError("An error occurred");
      setLoading(false);
    }
  }

  const categories = [
    { value: "LIFE", label: "Life Insurance" },
    { value: "HEALTH", label: "Health Insurance" },
    { value: "SUPPLEMENTAL", label: "Supplemental (CI, Accident, Hospital)" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new insurance product to your catalog
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Product Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., Term Life, Critical Illness"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">Product Code</label>
          <input
            id="code"
            name="code"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., TERM_LIFE, CI"
          />
          <p className="text-xs text-muted-foreground">A unique identifier used in data imports</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="carrierId" className="text-sm font-medium">Carrier</label>
          {loadingCarriers ? (
            <div className="flex h-10 items-center text-sm text-muted-foreground">Loading carriers...</div>
          ) : (
            <select
              id="carrierId"
              name="carrierId"
              required
              defaultValue={preselectedCarrierId || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a carrier...</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <select
            id="category"
            name="category"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
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