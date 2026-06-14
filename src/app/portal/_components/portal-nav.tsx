"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface PortalNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    npn?: string | null;
  };
}

export default function PortalNav({ user }: PortalNavProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/portal/admin" className="text-xl font-bold text-primary">
            InsureIQ
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/portal/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/portal/admin/intake"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Intake & Leads
            </Link>
            <Link
              href="/portal/admin/carriers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Carriers
            </Link>
            <Link
              href="/portal/admin/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Products
            </Link>
            <Link
              href="/portal/admin/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/portal/admin/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
