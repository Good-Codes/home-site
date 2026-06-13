import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomeFinalCta() {
  return (
    <section className="bg-neutral-950 py-20 text-white dark:bg-black sm:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[minmax(0,0.76fr)_auto] lg:items-end">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#67AFA7]/15 text-[#9ed9d2]">
              <MessageCircle className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#9ed9d2]">
              Start with a conversation
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Bring us the idea, the bottleneck, or the product that needs to grow up.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-300">
              We will help you understand the path, the tradeoffs, and the first practical step toward software that is useful, maintainable, and ready for real users.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]"
            >
              <Link href="/contact-us">
                Request a quote
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/our-projects">View work</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
