"use client";

export default function CopyLinkButton({ token }: { token: string }) {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";
  const url = `${baseUrl}/intake/${token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    alert("Intake link copied to clipboard!");
  }

  return (
    <button
      onClick={copyLink}
      className="text-sm text-primary hover:underline"
    >
      Copy Link
    </button>
  );
}