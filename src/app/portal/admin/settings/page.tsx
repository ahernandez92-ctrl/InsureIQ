"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [systemKeyAvailable, setSystemKeyAvailable] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/health-sherpa/sync");
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.agentKeyConfigured);
        setSystemKeyAvailable(data.systemKeyConfigured);
      }
    } catch {
      // API not available yet
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/health-sherpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "HealthSherpa API key saved and verified!" });
        setIsConfigured(true);
        setApiKey("");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save API key" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveKey() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/health-sherpa", { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "HealthSherpa API key removed" });
        setIsConfigured(false);
      } else {
        setMessage({ type: "error", text: "Failed to remove API key" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(state?: string) {
    setSyncing(true);
    setMessage(null);
    setSyncState(state || "CA");

    try {
      const res = await fetch("/api/health-sherpa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: state || "CA" }),
      });

      const data = await res.json();

      if (res.ok) {
        const stats = data.stats;
        setMessage({
          type: "success",
          text: `Synced ${stats.totalPlans} plans from ${data.message}. Created ${stats.carriersCreated} carriers, ${stats.productsCreated} products.`,
        });
      } else {
        setMessage({ type: "error", text: data.message || "Sync failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Sync failed. Check your API key." });
    } finally {
      setSyncing(false);
      setSyncState("");
    }
  }

  // Quick sync states for agents (states with large ACA markets)
  const syncStates = ["CA", "TX", "FL", "NY", "IL", "PA", "OH", "GA", "NC", "MI"];

  const keyAvailable = isConfigured || systemKeyAvailable;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account and integrations</p>
      </div>

      {message && (
        <div
          className={`rounded-md p-4 text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Profile</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd>{session?.user?.name || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd>{session?.user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">NPN</dt>
            <dd>{session?.user?.npn || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Role</dt>
            <dd>{session?.user?.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Licensed State</dt>
            <dd>{session?.user?.state || "Not set"}</dd>
          </div>
        </dl>
      </div>

      {/* HealthSherpa Integration */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">HealthSherpa Integration</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Sync ACA health plan data from HealthSherpa into InsureIQ. Plans are imported as
          carriers and products that you can then assign pricing tiers to.
        </p>

        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${keyAvailable ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-sm font-medium">
              {keyAvailable ? "API Key Available" : "No API Key Available"}
            </span>
          </div>
          {systemKeyAvailable && !isConfigured && (
            <p className="text-xs text-muted-foreground pl-6">
              Using system-level HEALTHSHERPA_API_KEY from environment
            </p>
          )}
        </div>

        {/* API Key Management */}
        <details className="mb-6 rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            {isConfigured ? "Update API Key" : "Configure API Key"}
          </summary>

          <form onSubmit={handleSaveKey} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">HealthSherpa API Key</label>
              <div className="flex gap-2">
                <input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="Enter your HealthSherpa API key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-secondary"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!apiKey || saving}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Verifying..." : "Save & Verify"}
              </button>
              {isConfigured && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md border border-destructive px-6 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Remove Key
                </button>
              )}
            </div>
          </form>
        </details>

        {/* Sync Plans */}
        {keyAvailable && (
          <div>
            <h3 className="mb-3 text-sm font-semibold">Sync Plans by State</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Click a state to fetch ACA plans from HealthSherpa and import them as carriers/products.
            </p>
            <div className="flex flex-wrap gap-2">
              {syncStates.map((state) => (
                <button
                  key={state}
                  onClick={() => handleSync(state)}
                  disabled={syncing}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50 min-w-[3rem]"
                >
                  {syncing && syncState === state ? "..." : state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}