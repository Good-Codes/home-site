"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

type Project = {
	name: string;
	client: string;
	technologies: string[];
	overview: string;
	platformLink: string;
};

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
	},
};

const projects: Project[] = [
	{
		name: "FlexiDrive",
		client: "AO Group",
		technologies: [ "Python", "Django Rest Framework", "Cartrack API", "Intellidrive API", "TransUnion API", "Experian API", "DirectDebit", "Signio", "Notion"],
		overview:
		"We strengthened a dealership management platform so teams could make faster, better-informed decisions across vehicle sales and finance operations. The work improved visibility into vehicle location and mileage, brought trusted valuation and credit insight into the workflow, and supported more consistent deal assessment. We also streamlined application capture and payment scheduling, helping the business reduce friction for staff while improving confidence in lending-related decisions.",
		platformLink: "https://flexidrive.co.za/",
	},
	{
		name: "Fininly",
		client: "Fininly (Maxcrowdfund derivative)",
		technologies: ["C# .NET", "ABP Boilerplate", "Angular", "Event-Driven Architecture", "Sumsub (KYC)", "OPP (Online Payment Platform)", "SQL Server"],
		overview:
			"We delivered a multi-tenant crowdfunding platform designed to support growth, investor trust, and operational control. The platform enabled secure onboarding, compliant identity verification, and dependable payment handling, while giving the business a foundation to serve multiple tenants without duplicating effort. It also established a scalable operational model that could evolve with future cloud migration plans.",
		platformLink: "https://www.fininly.com/",
	},
	{
		name: "Maximise",
		client: "Maxcrowdfund (Netherlands)",
		technologies: ["Vue.js", "Express.js", "Directus CMS", "Azure Pipelines", "Azure Cloud", "JavaScript"],
		overview:
			"We delivered a crowdfunding loan platform that helped the client launch and operate with greater speed, flexibility, and control. The solution supported core lending functions across payments, repayment schedules, and both individual and company journeys, making the platform easier to manage as business requirements evolved. We also supported the shift to a more resilient cloud-based delivery model, improving operational reliability over time.",
		platformLink: "https://app.maxcrowdfund.com/",
	},
	{
		name: "Currency Assist Magic System",
		client: "AO Group",
		technologies: ["React", "Next.js", "Tailwind CSS", "Python", "Django Rest Framework", "PostgreSQL", "Docker", "CircleCI", "DigitalOcean", "OpenAPI", "Google Docs API", "SonarCloud"],
		overview:
			"We built a platform that gave the business a clearer, more controlled way to manage currency trading and payment administration. The solution brought trading activity, payment operations, and document handling into a more cohesive workflow, reducing manual overhead and improving day-to-day efficiency. It also created a stronger operational foundation for reliable releases, quality control, and long-term maintainability.",
		platformLink: "https://www.currencyassist.com/",
	},
    {
        name: "PayZilch",
        client: "Mashlab Digital",
        technologies: ["React", "Redux", "Redux-Saga", "Java", "SpringBoot", "Maven", "AWS (S3, EC2)", "SQL Server", "GitHub"],
        overview:
			"We helped deliver a buy-now-pay-later platform focused on smoother customer journeys and dependable internal operations. The solution supported the full flow from user interaction to document handling and transaction processing, giving the business a stronger foundation for scaling responsibly. It also improved release reliability, helping the platform evolve without compromising operational confidence.",
        platformLink: "https://www.zilch.com/",
    },
	{
		name: "Corporate Internet Banking Solution (C2B)",
		client: "Sybrin Systems Limited Works",
		technologies: ["Angular 5", "MVC (C#)", "SQL Server", "Redux", "JWT", ".NET Framework"],
		overview:
			"We developed an enterprise corporate internet banking platform that enabled businesses to transact with their banks more efficiently across upper Africa. The solution supported secure session handling, reliable transaction processing, and high-performance access to critical banking data, helping the platform meet the demands of enterprise usage. The result was a stronger operational backbone for business-to-bank interactions at scale.",
		platformLink: "https://www.sybrin.com/c2b",
	},
	{
		name: "Adumo Online - Odoo Payment Gateway Custom Module",
		client: "AO Group",
		technologies: ["Python", "Odoo Web Library", "Postgress SQL", "Adumo Online API", "JWT", "Odoo App Store"],
		overview:
			"We built a custom payment module that enabled merchants using Odoo to accept card payments through Adumo Online with greater confidence and control. The solution supported secure checkout journeys, dependable transaction status handling, and better alignment with real-world payment operations such as refunds, tokenized payments, and manual capture. It gave the business a practical way to extend Odoo's native commerce capabilities without compromising payment integrity.",
		platformLink: "https://www.adumoonline.com/",
	},
	{
		name: "End-to-End Test Automation Platform (Crypto Exchange)",
		client: "VALR Technologies",
		technologies: ["Kotlin", "Kubernetes", "GitLab CI/CD", "Jira", "REST APIs", "Docker"],
		overview:
			"We developed and maintained an end-to-end automation platform that helped a high-volume cryptocurrency exchange protect confidence in its most critical workflows. The coverage focused on the business functions that matter most in a live trading environment, including trading activity, wallet operations, funding flows, and liquidation scenarios. By improving regression confidence and release readiness, the platform supported stronger transactional integrity, risk control, and operational reliability.",
		platformLink: "https://www.valr.com/en/",
	},
];

export default function Projects() {
	return (
		<section className="bg-white py-12 sm:py-24 dark:bg-neutral-900">
			<div className="container mx-auto max-w-6xl px-4 sm:px-6">
			<div className="flex items-center justify-center gap-2 sm:gap-3">
				<div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#67AFA7]/12 text-[#2f6f69] dark:bg-[#67AFA7]/10 dark:text-[#9ed9d2]">
					<FileText className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden />
				</div>
				<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
					Our Projects
				</h1>
			</div>
				<p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-center text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
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
							className="flex h-full flex-col border-transparent bg-neutral-50 shadow-md sm:shadow-lg shadow-[#67AFA7] dark:bg-neutral-800/50 dark:shadow-[#67AFA7]"
						>
							<CardHeader className="p-4 sm:p-6">
								<CardTitle className="text-base sm:text-xl text-neutral-900 dark:text-neutral-100">
									 {project.name}
								</CardTitle>
							</CardHeader>

							<CardContent className="flex h-full flex-1 flex-col gap-3 sm:gap-6 px-4 sm:px-6">
								<div>
									<h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Client:
									</h2>
									<p className="mt-1 sm:mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
										{project.client}
									</p>
								</div>

								<div>
									<h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Project Overview:
									</h2>
									<p className="mt-1 sm:mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
										{project.overview}
									</p>
								</div>

								<div>
									<h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Technologies:
									</h2>
									<div className="mt-1.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
										{project.technologies.map((technology) => (
											<span
												key={technology}
												className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] sm:text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
