import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

const principles = [
  {
    title: "People first",
    description:
      "The team portrait is not decoration. It reflects how we see good software: built through listening, shared context, and human judgment.",
    Icon: UsersRound,
  },
  {
    title: "Trust through clarity",
    description:
      "We keep decisions visible, explain tradeoffs plainly, and build products that clients can understand and own.",
    Icon: ShieldCheck,
  },
  {
    title: "Partnership after launch",
    description:
      "Our work does not end at deployment. We help products stay useful, stable, and ready for the next stage.",
    Icon: HeartHandshake,
  },
];

export default function AboutLink() {
  return (
    <section className="bg-white py-24 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(22rem,0.42fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              The people behind the product
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              A small team with the range to think, build, and stay accountable.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Good Code brings together software engineering, product thinking, cloud delivery, and practical business understanding. The result is a partner that can move from idea to launch without losing the thread.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]"
              >
                <Link href="/about-us">
                  Meet the team
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/[0.06]"
              >
                <Link href="/contact-us">Talk to us</Link>
              </Button>
            </div>
          </div>

          <div className="border-y border-neutral-200 dark:border-white/10">
            {principles.map(({ title, description, Icon }) => (
              <article key={title} className="flex gap-5 border-b border-neutral-200 py-6 last:border-b-0 dark:border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
