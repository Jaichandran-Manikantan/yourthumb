"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, LogOut, Wallet } from "lucide-react";
import { AffiliateModal } from "./affiliate-modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UserProfileMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const local = email.split("@")[0] ?? "U";
  const initials = local
    .split(/[.\-_ ]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || local.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-xs font-semibold text-white shadow-sm"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>

      {open && (
        <div className="studio-profile-menu absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border p-1 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-[#90877b]">{email}</p>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
            onClick={() => {
              setOpen(false);
              setAffiliateOpen(true);
            }}
          >
            <DollarSign className="size-4" />
            Affiliate Hub
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
            onClick={() => {
              setOpen(false);
              setAffiliateOpen(true);
            }}
          >
            <Wallet className="size-4" />
            Payout settings
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#ff8998] transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}

      <AffiliateModal open={affiliateOpen} onOpenChange={setAffiliateOpen} />
    </div>
  );
}
