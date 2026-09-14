"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import {
  AccountFieldGroup,
  ReadonlyField,
} from "@/components/account/account-chrome";
import { BrandButton } from "@/components/project-blueprint/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INDUSTRY_LABELS,
  INDUSTRY_VALUES,
  ORGANISATION_TYPE_LABELS,
  ORGANISATION_TYPE_VALUES,
  PREFERRED_CONTACT_LABELS,
  PREFERRED_CONTACT_VALUES,
  REFERRAL_SOURCE_LABELS,
  REFERRAL_SOURCE_VALUES,
  SA_PROVINCE_LABELS,
  SA_PROVINCE_VALUES,
  TEAM_SIZE_LABELS,
  TEAM_SIZE_VALUES,
  type CustomerProfile,
} from "@/lib/account/profile";

const emptyProfile: Omit<CustomerProfile, "email"> = {
  name: null,
  phone: null,
  preferredContact: null,
  organisation: null,
  jobTitle: null,
  city: null,
  province: null,
  organisationType: null,
  industry: null,
  teamSize: null,
  referralSource: null,
};

const selectClass =
  "flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-[#67AFA7] focus-visible:ring-[3px] focus-visible:ring-[#67AFA7]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100";

const optionClass = "bg-white text-neutral-900";

function OptionalSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        <option value="" className={optionClass}>
          Prefer not to say
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className={optionClass}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CustomerProfileForm() {
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/account/profile");
        const data = (await response.json().catch(() => ({}))) as {
          profile?: CustomerProfile;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Unable to load your profile.");
        }
        if (cancelled || !data.profile) return;
        setEmail(data.profile.email);
        setForm({
          name: data.profile.name,
          phone: data.profile.phone,
          preferredContact: data.profile.preferredContact,
          organisation: data.profile.organisation,
          jobTitle: data.profile.jobTitle,
          city: data.profile.city,
          province: data.profile.province,
          organisationType: data.profile.organisationType,
          industry: data.profile.industry,
          teamSize: data.profile.teamSize,
          referralSource: data.profile.referralSource,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load your profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        profile?: CustomerProfile;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save your profile.");
      }
      if (data.profile) {
        setForm({
          name: data.profile.name,
          phone: data.profile.phone,
          preferredContact: data.profile.preferredContact,
          organisation: data.profile.organisation,
          jobTitle: data.profile.jobTitle,
          city: data.profile.city,
          province: data.profile.province,
          organisationType: data.profile.organisationType,
          industry: data.profile.industry,
          teamSize: data.profile.teamSize,
          referralSource: data.profile.referralSource,
        });
        await update({ name: data.profile.name });
      }
      setSuccess("Your profile has been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading profile…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <AccountFieldGroup
        title="Contact"
        description="How we reach you about estimates and follow-ups."
      >
        <ReadonlyField
          label="Email"
          value={email}
          hint="This is your sign-in email and cannot be changed here."
        />
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            value={form.name ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone / WhatsApp</Label>
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
        </div>
        <OptionalSelect
          id="profile-preferred-contact"
          label="Preferred contact"
          value={form.preferredContact ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              preferredContact: value
                ? (value as CustomerProfile["preferredContact"])
                : null,
            }))
          }
          options={PREFERRED_CONTACT_VALUES.map((value) => ({
            value,
            label: PREFERRED_CONTACT_LABELS[value],
          }))}
        />
      </AccountFieldGroup>

      <AccountFieldGroup title="Organisation">
        <div className="space-y-2">
          <Label htmlFor="profile-organisation">Organisation</Label>
          <Input
            id="profile-organisation"
            name="organisation"
            autoComplete="organization"
            value={form.organisation ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                organisation: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-job-title">Job title</Label>
          <Input
            id="profile-job-title"
            name="jobTitle"
            autoComplete="organization-title"
            value={form.jobTitle ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                jobTitle: event.target.value,
              }))
            }
          />
        </div>
      </AccountFieldGroup>

      <AccountFieldGroup title="Location">
        <div className="space-y-2">
          <Label htmlFor="profile-city">City</Label>
          <Input
            id="profile-city"
            name="city"
            autoComplete="address-level2"
            value={form.city ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
          />
        </div>
        <OptionalSelect
          id="profile-province"
          label="Province"
          value={form.province ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              province: value ? (value as CustomerProfile["province"]) : null,
            }))
          }
          options={SA_PROVINCE_VALUES.map((value) => ({
            value,
            label: SA_PROVINCE_LABELS[value],
          }))}
        />
      </AccountFieldGroup>

      <AccountFieldGroup title="About your work">
        <OptionalSelect
          id="profile-org-type"
          label="Organisation type"
          value={form.organisationType ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              organisationType: value
                ? (value as CustomerProfile["organisationType"])
                : null,
            }))
          }
          options={ORGANISATION_TYPE_VALUES.map((value) => ({
            value,
            label: ORGANISATION_TYPE_LABELS[value],
          }))}
        />
        <OptionalSelect
          id="profile-industry"
          label="Industry"
          value={form.industry ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              industry: value ? (value as CustomerProfile["industry"]) : null,
            }))
          }
          options={INDUSTRY_VALUES.map((value) => ({
            value,
            label: INDUSTRY_LABELS[value],
          }))}
        />
        <OptionalSelect
          id="profile-team-size"
          label="Team size"
          value={form.teamSize ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              teamSize: value ? (value as CustomerProfile["teamSize"]) : null,
            }))
          }
          options={TEAM_SIZE_VALUES.map((value) => ({
            value,
            label: TEAM_SIZE_LABELS[value],
          }))}
        />
        <OptionalSelect
          id="profile-referral"
          label="How did you hear about us?"
          value={form.referralSource ?? ""}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              referralSource: value
                ? (value as CustomerProfile["referralSource"])
                : null,
            }))
          }
          options={REFERRAL_SOURCE_VALUES.map((value) => ({
            value,
            label: REFERRAL_SOURCE_LABELS[value],
          }))}
        />
      </AccountFieldGroup>

      {error ? (
        <p className="pt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="pt-4 text-sm text-[#2f6f69] dark:text-[#9ed9d2]"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div className="flex justify-start pt-2">
        <BrandButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </BrandButton>
      </div>
    </form>
  );
}
