import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutLink() {
	return (
		<section className="bg-white py-16 dark:bg-neutral-900">
			<div className="container mx-auto max-w-5xl px-6">
				<div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 md:p-8">
					<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#67AFA7]">
						About Good Code
					</p>
					<h3 className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
						Learn more about who we are and how we work
					</h3>
					<p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 md:text-base">
						Explore our story, values, and approach to building reliable digital products.
					</p>

					<Button asChild size="lg" className="mt-6">
						<Link href="/about-us">About Us</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
