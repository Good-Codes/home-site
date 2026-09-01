"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { smoothEase } from "@/lib/motion";
import { projects } from "@/lib/projects-data";

const containerVariants: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: smoothEase },
	},
};

export default function Projects() {
	return (
		<section className="bg-white py-20 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28">
			<div className="container mx-auto max-w-6xl px-4 sm:px-6">
			<div className="flex items-center justify-center gap-2 sm:gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300 sm:h-11 sm:w-11">
					<FileText className="h-5 w-5" aria-hidden />
				</div>
				<h1 className="text-3xl font-semibold text-neutral-950 dark:text-white sm:text-4xl md:text-5xl">
					Our Projects
				</h1>
			</div>
				<p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-neutral-600 dark:text-neutral-300 sm:text-base">
					Examples of solutions we have delivered across web, mobile, and cloud platforms.
				</p>

				<motion.div
					className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-4 sm:gap-8"
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
				>
					{projects.map((project) => (
						<motion.div key={project.name} variants={cardVariants} className="w-full md:w-[calc(50%-1rem)]">
						<Card
							className="flex h-full flex-col border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#67AFA7]/50 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20"
						>
							<CardHeader className="p-4 sm:p-6">
								<CardTitle className="text-base sm:text-xl text-neutral-900 dark:text-neutral-100">
									 {project.name}
								</CardTitle>
							</CardHeader>

							<CardContent className="flex h-full flex-1 flex-col gap-3 sm:gap-6 px-4 sm:px-6">
								<div>
									<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 sm:text-sm">
										Client:
									</h2>
									<p className="mt-1 sm:mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
										{project.client}
									</p>
								</div>

								<div>
									<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 sm:text-sm">
										Project Overview:
									</h2>
									<p className="mt-1 sm:mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
										{project.overview}
									</p>
								</div>

								<div>
									<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400 sm:text-sm">
										Technologies:
									</h2>
									<div className="mt-1.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
										{project.technologies.map((technology) => (
											<span
												key={technology}
												className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 sm:text-xs"
											>
												{technology}
											</span>
										))}
									</div>
								</div>

								<div className="mt-auto">
									<a 
										href={project.platformLink}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-1 sm:mt-3 inline-flex text-xs sm:text-sm text-[#67AFA7] underline break-all hover:text-[#559e97] dark:text-[#67AFA7] dark:hover:text-[#86c9c2]"
									>
										Visit Platform &rarr;
									</a>
								</div>
							</CardContent>
						</Card>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
