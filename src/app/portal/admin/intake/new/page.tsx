"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewIntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    token: string;
    expiresAt: string;
  } | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  async function generateLink() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/intake/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName || undefined,
          clientEmail: clientEmail || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to generate link");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (result?.url) {
      await navigator.clipboard.writeText(result.url);
      alert("Link copied to clipboard!");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Client Intake Link</h1>
        <p className="mt-2 text-muted-foreground">
          Create a secure, tokenized link to send to your client for intake.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Client Name (optional)</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Client Email (optional)</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g., john@example.com"
          />
        </div>

        <button
          onClick={generateLink}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Intake Link"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
          <h2 className="font-semibold text-green-800">Link Generated!</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-green-700">
              Intake URL (send this to your client)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.url}
                className="flex h-10 w-full rounded-md border border-green-300 bg-white px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-sm text-green-700">
            This link expires on {new Date(result.expiresAt).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setClientName("");
                setClientEmail("");
                setResult(null);
              }}
              className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Generate Another
            </button>
            <button
              onClick={() => router.push("/portal/admin")}
              className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}