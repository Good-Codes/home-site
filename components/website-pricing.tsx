import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pricingTiers = [
  {
    name: "Starter",
    slug: "starter",
    price: "R3,950",
    badge: undefined,
    fit: "A single-page site for a new business that needs a credible presence, fast.",
    features: [
      "1 page, custom layout",
      "Mobile responsive",
      "Contact form",
      "WhatsApp + Google Maps",
      "Basic SEO & SSL",
      "1 revision round",
      "2 weeks support",
    ],
  },
  {
    name: "Business",
    slug: "business",
    price: "R7,950",
    badge: "Most Popular",
    fit: "A complete small-business site - the right starting point for most clients.",
    features: [
      "Up to 5 pages, custom",
      "Everything in Starter, plus:",
      "Enquiry form",
      "Basic content loading",
      "2 revision rounds",
      "Handover training",
      "4 weeks support",
    ],
  },
  {
    name: "Business Plus",
    slug: "business-plus",
    price: "R12,950",
    badge: undefined,
    fit: "A larger brochure site for an established business with more to say.",
    features: [
      "Up to 8 pages, custom",
      "Everything in Business, plus:",
      "Blog / news section",
      "Image & video gallery",
      "POPIA compliance pack",
      "3 revision rounds",
      "6 weeks support",
    ],
  },
] as const;

const addOns = [
  ["Extra page", "R650"],
  ["Copywriting per page", "R450"],
  ["Logo design", "R1,500"],
  ["POPIA compliance pack", "R1,200"],
  ["Booking / enquiry calendar", "R1,800"],
  ["Extra revision round", "R600"],
  ["Rush fee", "+40%"],
] as const;

const hourlyRates = [
  ["Standard changes & edits", "R450/hr"],
  ["Development & integrations", "R650/hr"],
] as const;

const carePlans = [
  {
    name: "Care Lite",
    price: "R299/mo",
    core: "Hosting, backups, security, monitoring.",
  },
  {
    name: "Care Standard",
    price: "R650/mo",
    core: "Lite + 1 hr edits/mo + monthly check.",
  },
  {
    name: "Care Pro",
    price: "R1,250/mo",
    core: "Standard + 3 hrs edits + priority support.",
  },
] as const;

const processSteps = ["Enquiry", "Quote", "50% deposit", "Build", "Go live"] as const;

const faqs = [
  {
    question: "What does \"from\" pricing mean?",
    answer:
      "It is the starting price for a standard build. Your final quote may change if you add extra pages, copywriting, integrations, rush delivery, or other add-ons.",
  },
  {
    question: "Which package should I choose?",
    answer:
      "Starter is best for a simple one-page presence. Business is the best fit for most small businesses. Business Plus is for larger brochure sites that need more content, media, or compliance support.",
  },
  {
    question: "Are hosting and maintenance included?",
    answer:
      "Project packages cover the website build. Ongoing hosting, backups, security, monitoring, and edits are available through the monthly care plans.",
  },
  {
    question: "Can I add features later?",
    answer:
      "Yes. Extra pages, copywriting, logo design, POPIA compliance, booking calendars, revisions, and development work can be added as needed.",
  },
  {
    question: "How do payments work?",
    answer:
      "A 50% deposit starts the project after the agreement is signed. The remaining 50% is paid on completion before the website goes live.",
  },
  {
    question: "What happens after launch?",
    answer:
      "Each package includes a short support period. For ongoing support, choose a monthly care plan.",
  },
] as const;

function quoteHref(packageSlug?: string) {
  return packageSlug
    ? `/contact-us?package=${packageSlug}`
    : "/contact-us?service=website-pricing";
}

function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      )}
    </div>
  );
}

function BrandButton({
  href,
  children,
  className,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
}) {
  return (
    <Button
      asChild
      size="lg"
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(
        variant === "solid" &&
          "bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]/50",
        variant === "outline" &&
          "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/[0.06]",
        className,
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export default function WebsitePricing() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-neutral-200 bg-white py-20 text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100 sm:py-24 lg:py-28">
        <div className="container mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f6f69] dark:text-[#9ed9d2]">
            Website Services
          </p>
          <h1 className="mx-auto mt-4 max-w-5xl text-4xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-5xl md:text-6xl">
            Clear website packages for growing businesses
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300 sm:text-lg">
            Choose a scoped website package, add the extras you need, and get a
            professional Good Code build with clear pricing from the start.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BrandButton href={quoteHref()}>Get a quote</BrandButton>
            <BrandButton href="#packages" variant="outline">
              Compare packages
            </BrandButton>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              ["Entry point", "from R3,950"],
              ["Most clients", "Business package"],
              ["Timeline", "Scoped before build"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="bg-white py-20 dark:bg-neutral-950 sm:py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Packages"
            title="Pick the right starting scope"
            description="Each package starts with a clear fit, then a checklist of what is included. Business is the best starting point for most small businesses."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => {
              const featured = tier.name === "Business";

              return (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative h-full rounded-lg border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#67AFA7]/50 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20",
                    featured &&
                      "border-[#67AFA7]/70 ring-1 ring-[#67AFA7]/20",
                  )}
                >
                  {tier.badge && (
                    <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#67AFA7]/12 px-3 py-1 text-xs font-semibold text-[#2f6f69] dark:bg-[#67AFA7]/15 dark:text-[#9ed9d2]">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      {tier.badge}
                    </div>
                  )}

                  <CardContent className="flex h-full flex-col p-6">
                    <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                      {tier.name}
                    </h3>
                    <div className="mt-5 flex items-end gap-2">
                      <span className="pb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        from
                      </span>
                      <span className="text-4xl font-semibold text-neutral-950 dark:text-white">
                        {tier.price}
                      </span>
                    </div>
                    <p className="mt-5 min-h-20 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {tier.fit}
                    </p>

                    <ul className="mt-6 space-y-3 border-t border-neutral-200 pt-6 dark:border-white/10">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6f69] dark:text-[#9ed9d2]"
                            aria-hidden
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <BrandButton
                      href={quoteHref(tier.slug)}
                      className="mt-8 w-full"
                      variant={featured ? "solid" : "outline"}
                    >
                      Get a quote
                    </BrandButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20 dark:border-white/10 dark:bg-neutral-950 sm:py-24">
        <div className="container mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <div>
            <SectionHeading
              eyebrow="Add-ons"
              title="Add what your website needs"
              description="These options can be added to any package where relevant, so your quote reflects the work your site actually needs."
              className="text-left [&_*]:text-left"
            />

            <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-[0.16em] text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Add-on
                    </th>
                    <th scope="col" className="px-5 py-4 text-right font-semibold">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/10">
                  {addOns.map(([item, price]) => (
                    <tr key={item}>
                      <th
                        scope="row"
                        className="px-5 py-4 text-left font-medium text-neutral-800 dark:text-neutral-100"
                      >
                        {item}
                      </th>
                      <td className="px-5 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                        {price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="rounded-lg border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                  <Clock3 className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Ad-hoc hourly rates
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  For work outside the original scope, ad-hoc changes are billed
                  at the relevant hourly rate after approval.
                </p>
                <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-white/10">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-200 dark:divide-white/10">
                      {hourlyRates.map(([workType, rate]) => (
                        <tr key={workType}>
                          <th
                            scope="row"
                            className="px-4 py-3 text-left font-medium text-neutral-700 dark:text-neutral-200"
                          >
                            {workType}
                          </th>
                          <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">
                            {rate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                  <CreditCard className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Payment terms
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                  50% deposit to start with the signed agreement; 50% on
                  completion before go-live. Quotes are valid for 30 days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20 dark:border-white/10 dark:bg-neutral-950 sm:py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Care Plans"
            title="Support after your website is live"
            description="Monthly care plans keep hosting, backups, monitoring, and approved edits under one predictable support agreement."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {carePlans.map((plan) => (
              <Card
                key={plan.name}
                className="rounded-lg border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] transition hover:-translate-y-0.5 hover:border-[#67AFA7]/50 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20"
              >
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                    <LifeBuoy className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {plan.name}
                  </h3>
                  <p className="mt-3 text-3xl font-semibold text-neutral-950 dark:text-white">
                    {plan.price}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {plan.core}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20 dark:border-white/10 dark:bg-neutral-950 sm:py-24">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-4xl">
                From enquiry to go-live
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">
                A scoped enquiry becomes a clear quote. Once the agreement is
                signed and the deposit is paid, we build, review, and launch.
              </p>
            </div>

            <ol className="grid gap-4 sm:grid-cols-5 lg:gap-3">
              {processSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-[#2f6f69] dark:bg-white/[0.06] dark:text-[#9ed9d2]">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-20 dark:border-white/10 dark:bg-neutral-950 sm:py-24">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
              <HelpCircle className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-4xl">
              Questions before you quote?
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">
              These are the decisions most clients need to understand before
              choosing a package.
            </p>
          </div>

          <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-neutral-900 outline-none transition hover:text-[#2f6f69] focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:text-neutral-100 dark:hover:text-[#9ed9d2] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <Plus
                    className="h-5 w-5 shrink-0 text-[#2f6f69] transition group-open:rotate-45 dark:text-[#9ed9d2]"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 py-20 text-white dark:bg-black sm:py-24">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#67AFA7]/15 text-[#9ed9d2]">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold md:text-4xl">
            Ready to price your website properly?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-300">
            Tell us what you need and we'll help you choose the right package.
          </p>
          <div className="mt-8 flex justify-center">
            <BrandButton href={quoteHref()} className="group">
              Get a quote
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </BrandButton>
          </div>
        </div>
      </section>
    </>
  );
}
