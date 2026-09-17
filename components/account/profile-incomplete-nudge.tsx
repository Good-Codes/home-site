"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, UserRound, X } from "lucide-react";

import {
  isCustomerProfileIncomplete,
  type CustomerProfile,
} from "@/lib/account/profile";
import {
  readProfileNudgeDismissed,
  writeProfileNudgeDismissed,
} from "@/lib/account/profile-nudge";
import { isProfileNudgeHiddenPath } from "@/lib/account/paths";
import { isStaffRole } from "@/lib/auth/roles";
import { smoothEase } from "@/lib/motion";

export function ProfileIncompleteNudge() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [incomplete, setIncomplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  const userId = session?.user?.id;
  const isCustomer =
    status === "authenticated" &&
    Boolean(userId) &&
    !isStaffRole(session?.user?.role);
  const hiddenPath = isProfileNudgeHiddenPath(pathname ?? "");

  useEffect(() => {
    if (!isCustomer || !userId) {
      setIncomplete(false);
      setDismissed(false);
      setReady(false);
      return;
    }

    if (readProfileNudgeDismissed(userId)) {
      setDismissed(true);
      setIncomplete(false);
      setReady(true);
      return;
    }

    setDismissed(false);

    if (hiddenPath) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/account/profile");
        const data = (await response.json().catch(() => ({}))) as {
          profile?: CustomerProfile;
        };
        if (cancelled) return;
        const profile = data.profile;
        setIncomplete(
          Boolean(
            response.ok && profile && isCustomerProfileIncomplete(profile),
          ),
        );
      } catch {
        if (!cancelled) setIncomplete(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hiddenPath, isCustomer, userId]);

  const onDismiss = () => {
    if (userId) writeProfileNudgeDismissed(userId);
    setDismissed(true);
  };

  const visible =
    ready && isCustomer && incomplete && !dismissed && !hiddenPath;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-labelledby="profile-nudge-title"
          initial={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
          }
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ delay: 0.45, duration: 0.45, ease: smoothEase }}
          className="fixed top-[4.75rem] right-4 z-40 w-[min(19.25rem,calc(100vw-2rem))]"
        >
          <div className="rounded-xl border border-neutral-200 bg-white/90 p-3.5 shadow-sm shadow-neutral-950/[0.06] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-black/30">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#67AFA7]/15 text-[#2f6f69] dark:text-[#9ed9d2]">
                <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  id="profile-nudge-title"
                  className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white"
                >
                  Finish your profile
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                  A few details are still empty. Adding them helps us follow up
                  on estimates.
                </p>
                <Link
                  href="/account"
                  onClick={onDismiss}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-[#2f6f69] underline-offset-2 transition hover:underline dark:text-[#9ed9d2]"
                >
                  Complete profile
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss profile reminder"
                className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:hover:bg-white/10 dark:hover:text-neutral-200"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
