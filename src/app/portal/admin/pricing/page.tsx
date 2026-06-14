"use client";

import { useState } from "react";

export default function PricingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pricing/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("Pricing data imported successfully");
        setFile(null);
      } else {
        const err = await res.json();
        setMessage(err.message || "Upload failed");
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and manage carrier pricing data
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">CSV Import</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Pricing CSV File
            </label>
            <p className="text-xs text-muted-foreground">
              Expected format: product_code, state, age_from, age_to, tier, amount
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.includes("successfully")
                  ? "bg-green-100 text-green-700"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Pricing Data</h2>
        <p className="text-muted-foreground">
          Upload a pricing CSV file to populate pricing data. You can view
          and manage prices through the product detail pages.
        </p>
      </div>
    </div>
  );
}