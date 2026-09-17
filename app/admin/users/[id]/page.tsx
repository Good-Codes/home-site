import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  AccountCard,
  AccountPageHeader,
  ReadonlyField,
} from "@/components/account/account-chrome";
import { BrandButton } from "@/components/project-blueprint/ui";
import { getAdminUserDetail } from "@/lib/auth/admin-users";
import { isStaffRole } from "@/lib/auth/roles";
import {
  formatEnumLabel,
  INDUSTRY_LABELS,
  ORGANISATION_TYPE_LABELS,
  PREFERRED_CONTACT_LABELS,
  REFERRAL_SOURCE_LABELS,
  SA_PROVINCE_LABELS,
  TEAM_SIZE_LABELS,
} from "@/lib/account/profile";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "User",
  robots: { index: false, follow: false },
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

function estimateStatusLabel(savedToProfile: boolean, status: string): string {
  if (savedToProfile) return "Saved";
  if (status === "in_progress") return "In progress";
  return status.replace(/_/g, " ");
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    redirect("/login?next=/admin/users");
  }

  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  const isCustomer = user.role === "CUSTOMER";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AccountPageHeader
          eyebrow="Users"
          title={user.name?.trim() || user.email}
          description={
            isCustomer
              ? "Customer profile, saved estimates, and earlier planning work."
              : "Staff account."
          }
        />
        <BrandButton href="/admin/users" variant="outline">
          All users
        </BrandButton>
      </div>

      {user.locked ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
          role="status"
        >
          This account is locked and cannot sign in until it is unlocked.
        </p>
      ) : null}

      <AccountCard title="Account">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="Email" value={user.email} />
          <ReadonlyField label="Role" value={user.role.toLowerCase()} />
          <ReadonlyField
            label="Status"
            value={user.locked ? "Locked" : "Active"}
          />
          <ReadonlyField label="Created" value={formatDate(user.createdAt)} />
        </div>
      </AccountCard>

      {isCustomer ? (
        <>
          <AccountCard title="Profile">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ProfileRow label="Name" value={user.profile.name} />
              <ProfileRow label="Phone" value={user.profile.phone} />
              <ProfileRow
                label="Preferred contact"
                value={formatEnumLabel(
                  user.profile.preferredContact,
                  PREFERRED_CONTACT_LABELS,
                )}
              />
              <ProfileRow
                label="Organisation"
                value={user.profile.organisation}
              />
              <ProfileRow label="Job title" value={user.profile.jobTitle} />
              <ProfileRow label="City" value={user.profile.city} />
              <ProfileRow
                label="Province"
                value={formatEnumLabel(user.profile.province, SA_PROVINCE_LABELS)}
              />
              <ProfileRow
                label="Organisation type"
                value={formatEnumLabel(
                  user.profile.organisationType,
                  ORGANISATION_TYPE_LABELS,
                )}
              />
              <ProfileRow
                label="Industry"
                value={formatEnumLabel(user.profile.industry, INDUSTRY_LABELS)}
              />
              <ProfileRow
                label="Team size"
                value={formatEnumLabel(user.profile.teamSize, TEAM_SIZE_LABELS)}
              />
              <ProfileRow
                label="How they found us"
                value={formatEnumLabel(
                  user.profile.referralSource,
                  REFERRAL_SOURCE_LABELS,
                )}
              />
            </dl>
          </AccountCard>

          <AccountCard
            title="Estimates"
            description="Saved profile estimates and earlier planning estimates from this account."
          >
            {user.estimates.length === 0 ? (
              <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                This customer has no estimates yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-600 dark:border-white/10 dark:text-neutral-400">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Estimate</th>
                      <th className="py-2 pr-4 font-semibold">Range</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.estimates.map((estimate) => {
                      const label = estimateStatusLabel(
                        estimate.savedToProfile,
                        estimate.status,
                      );
                      const href = estimate.resultId
                        ? `/admin/project-blueprint/${estimate.resultId}`
                        : null;
                      return (
                        <tr
                          key={estimate.estimateId}
                          className="border-b border-neutral-100 last:border-0 dark:border-white/5"
                        >
                          <td className="py-3 pr-4">
                            {href ? (
                              <Link
                                href={href}
                                className="font-medium text-[#1f4f4a] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
                              >
                                {estimate.productSummary}
                              </Link>
                            ) : (
                              <span>{estimate.productSummary}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 font-medium">
                            {estimate.rangeLabel ?? "—"}
                          </td>
                          <td className="py-3 pr-4 capitalize">{label}</td>
                          <td className="py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                            {formatDate(estimate.updatedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AccountCard>
        </>
      ) : null}
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-900 dark:text-neutral-100">
        {value ?? "—"}
      </dd>
    </div>
  );
}
