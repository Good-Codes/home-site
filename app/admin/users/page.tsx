"use client";

import { useEffect, useState } from "react";

import { BrandButton } from "@/components/project-blueprint/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function isLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = async () => {
    setError(null);
    const response = await fetch("/api/admin/users");
    const data = (await response.json().catch(() => ({}))) as {
      users?: AdminUserRow[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "Unable to load users.");
    }
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadUsers();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSetPassword = async (userId: string) => {
    setMessage(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusyId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to update that password.");
        return;
      }
      setPasswordUserId(null);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } finally {
      setBusyId(null);
    }
  };

  const onUnlock = async (userId: string) => {
    setMessage(null);
    setError(null);
    setBusyId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/unlock`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to unlock that account.");
        return;
      }
      await loadUsers();
      setMessage("Account unlocked.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Users
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Signed-up accounts. Set a new password or unlock an account after too
          many failed sign-in attempts.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-[#2f6f69] dark:text-[#9ed9d2]" role="status">
          {message}
        </p>
      ) : null}

      {users.length === 0 && !loading && !error ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          No users yet.
        </p>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#f0f7f6] text-xs uppercase tracking-wide text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Failed</th>
                <th className="px-4 py-3 font-semibold">Lock</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const locked = isLocked(user.lockedUntil);
                return (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {user.email}
                      </div>
                      {user.name ? (
                        <div className="text-xs text-neutral-500">{user.name}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role.toLowerCase()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">{user.failedLoginCount}</td>
                    <td className="px-4 py-3">
                      {locked ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-500/20 dark:text-amber-100">
                          Locked
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-[#1f4f4a] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
                          onClick={() => {
                            setPasswordUserId(
                              passwordUserId === user.id ? null : user.id,
                            );
                            setNewPassword("");
                            setConfirmPassword("");
                            setError(null);
                          }}
                        >
                          Set password
                        </button>
                        {locked ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-[#1f4f4a] underline-offset-4 hover:underline disabled:opacity-60 dark:text-[#9ed9d2]"
                            disabled={busyId === user.id}
                            onClick={() => void onUnlock(user.id)}
                          >
                            Unlock
                          </button>
                        ) : null}
                      </div>
                      {passwordUserId === user.id ? (
                        <form
                          className="mt-3 max-w-sm space-y-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void onSetPassword(user.id);
                          }}
                        >
                          <div className="space-y-1">
                            <Label htmlFor={`new-${user.id}`}>New password</Label>
                            <Input
                              id={`new-${user.id}`}
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={PASSWORD_MIN_LENGTH}
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`confirm-${user.id}`}>
                              Confirm password
                            </Label>
                            <Input
                              id={`confirm-${user.id}`}
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={PASSWORD_MIN_LENGTH}
                              value={confirmPassword}
                              onChange={(event) =>
                                setConfirmPassword(event.target.value)
                              }
                            />
                          </div>
                          <BrandButton
                            type="submit"
                            disabled={busyId === user.id}
                            className="w-full"
                          >
                            {busyId === user.id ? "Saving…" : "Save password"}
                          </BrandButton>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
