import "server-only";

import { getPlaceholderConfig } from "@/lib/project-blueprint/engine/config/placeholder";

/**
 * Admin pricing overview — metadata only.
 * Role sell rates / margins are never rendered or returned to the browser.
 */
export default function AdminPricingPage() {
  const config = getPlaceholderConfig();
  const packageCount = config.workPackages.length;
  const roleCount = config.roles.length;
  const scenarioNames = config.scenarios.map((s) => s.name).join(", ");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Pricing configuration
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Published pricing versions are immutable. Edits require a new draft and
          a new published version — never mutate live rates in place.
        </p>
      </header>

      <p
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
        role="status"
      >
        PLACEHOLDER rates — do not treat as calibrated. Clients never see the
        word “placeholder”; admins must until a calibrated version is published.
      </p>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold">Published version</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Version</dt>
            <dd className="mt-1 font-medium">{config.pricingVersion}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Placeholder flag</dt>
            <dd className="mt-1 font-medium">
              {config.isPlaceholder ? "true (PLACEHOLDER)" : "false"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Currency</dt>
            <dd className="mt-1 font-medium">{config.commercial.currency}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Work packages</dt>
            <dd className="mt-1 font-medium">{packageCount}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Roles (internal)</dt>
            <dd className="mt-1 font-medium">
              {roleCount} — rates not shown in this UI
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Scenarios</dt>
            <dd className="mt-1 font-medium">{scenarioNames}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          To change commercial rules: update a <code>pricing_drafts</code> row,
          review checksums, then publish a new immutable{" "}
          <code>pricing_versions</code> snapshot. Role sell rates and margins
          remain server-only and must never appear in client or document
          responses.
        </p>
      </section>
    </div>
  );
}
