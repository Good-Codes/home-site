"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import { BrandButton } from "@/components/project-blueprint/ui";

export function DeleteAccountCard() {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const onDelete = async () => {
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Unable to delete your account.");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete your account.",
      );
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        Deleting your account removes your sign-in and profile. Good Code keeps
        planning estimates and related enquiry records, including the name and
        email on those records, so we can continue commercial follow-up.
      </p>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {confirming ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Confirm deletion? You will be signed out and will not be able to
            sign in again with this account.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void onDelete()}
              className="inline-flex h-10 items-center rounded-md bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Confirm deletion"}
            </button>
            <BrandButton
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </BrandButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError("");
            setConfirming(true);
          }}
          className="inline-flex h-10 items-center rounded-md border border-red-300 px-4 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
        >
          Delete account
        </button>
      )}
    </div>
  );
}
