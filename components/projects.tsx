import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Project = {
	name: string;
	client: string;
	technologies: string[];
	overview: string;
	platformLink: string;
};

const projects: Project[] = [
	{
		name: "FlexiDrive",
		client: "AO Group",
		technologies: [ "Python", "Django Rest Framework", "Cartrack API", "Intellidrive API", "TransUnion API", "Experian API", "DirectDebit", "Signio", "Notion"],
		overview:
			"Enhancement and maintenance of an existing dealership management platform. Integration of Cartrack and Intellidrive for vehicle tracking and mileage data. Integration of TransUnion for vehicle retail and trade valuations and Experian for credit risk assessment. Implementation of DirectDebit for payment scheduling and Signio for dealership application capture. Development of an application scoring system using credit bureau data.",
		platformLink: "https://flexidrive.co.za/",
	},
	{
		name: "Fininly",
		client: "Fininly (Maxcrowdfund derivative)",
		technologies: ["C# .NET", "ABP Boilerplate", "Angular", "Event-Driven Architecture", "Sumsub (KYC)", "OPP (Online Payment Platform)", "SQL Server"],
		overview:
			"Development of a multi-tenant crowdfunding platform. Implementation of event-driven architecture using C# .NET ABP Boilerplate. Development of Angular frontend with advanced session management functionality. Integration of Sumsub for KYC (Know your customer) verification and OPP (Online Payment Platform) for payment processing. SQL Server database implementation with planned cloud migration.",
		platformLink: "https://www.fininly.com/",
	},
	{
		name: "Maximise",
		client: "Maxcrowdfund (Netherlands)",
		technologies: ["Vue.js", "Express.js", "Directus CMS", "Azure Pipelines", "Azure Cloud", "JavaScript"],
		overview:
			"Development of a crowdfunding loan platform for a Netherlands-based client. Implementation of Vue.js frontend with Directus CMS for rapid model and endpoint configuration. Development of Express.js microservices for Payments, Schedules, Individual, and Company modules. Migration from self-hosted infrastructure to Azure Pipelines and Azure cloud environment.",
		platformLink: "https://app.maxcrowdfund.com/",
	},
	{
		name: "Currency Assist Magic System",
		client: "AO Group",
		technologies: ["React", "Next.js", "Tailwind CSS", "Python", "Django Rest Framework", "PostgreSQL", "Docker", "CircleCI", "DigitalOcean", "OpenAPI", "Google Docs API", "SonarCloud"],
		overview:
			"Development of a currency trading and payment administration platform. Implementation of React frontend using Next.js and Tailwind CSS with OpenAPI client generation. Development of Python/Django Rest Framework backend with PostgreSQL database. Integration of Google Docs API for file management. Containerization using Docker. Establishment of CI/CD pipeline using CircleCI and DigitalOcean with automated testing and SonarCloud code quality analysis.",
		platformLink: "https://www.currencyassist.com/",
	},
    {
        name: "PayZilch",
        client: "Mashlab Digital",
        technologies: ["React", "Redux", "Redux-Saga", "Java", "SpringBoot", "Maven", "AWS (S3, EC2)", "SQL Server", "GitHub"],
        overview:
            "Development of a buy-now-pay-later platform. Implementation of React frontend using Redux and Redux-Saga for state management. Development of Java backend services using SpringBoot and Maven. Deployment on AWS infrastructure including S3 for document storage and EC2 for hosting. SQL Server database management and automated GitHub-based deployment workflows.",
        platformLink: "https://www.zilch.com/",
    },
	{
		name: "Corporate Internet Banking Solution (C2B)",
		client: "Sybrin Systems Limited Works",
		technologies: ["Angular 5", "MVC (C#)", "SQL Server", "Redux", "JWT", ".NET Framework"],
		overview:
			"Development of an enterprise corporate internet banking platform enabling business-to-bank transactions across upper Africa. Implementation of Angular 5 frontend with Redux for session management and JWT authentication. Development of MVC middleware services and multi-threaded transaction processing. SQL Server database design including stored procedures, triggers, views, and indexed clusters for high-performance data retrieval.",
		platformLink: "https://www.sybrin.com/c2b",
	},
	{
		name: "Adumo Online - Odoo Payment Gateway Custom Module",
		client: "AO Group",
		technologies: ["Python", "Odoo Web Library", "Postgress SQL", "Adumo Online API", "JWT", "Odoo App Store"],
		overview:
			"Development of a custom Odoo payment provider addon integrating the Adumo Online payment gateway to accept credit/debit card payments via PCI-compliant hosted payment pages. Implementation of JWT (HS256) request signing and callback verification using PyJWT, with separate staging and production API endpoints. Extension of Odoo's native payment.provider and payment.transaction flows to support redirect-based checkout, success/pending/failed transaction states, server-to-server webhooks plus customer return handling , and advanced capabilities including tokenization , partial refunds, and manual capture for authorized transactions.",
		platformLink: "https://www.adumoonline.com/",
	},
	{
		name: "End-to-End Test Automation Platform (Crypto Exchange)",
		client: "VALR Technologies",
		technologies: ["Kotlin", "Kubernetes", "GitLab CI/CD", "Jira", "REST APIs", "Docker"],
		overview:
			"Development and maintenance of an end-to-end automated testing framework for a high-volume cryptocurrency exchange platform. Implemented Kotlin-based test suites to validate trading engine workflows, order matching logic, wallet operations, funding flows, and liquidation scenarios. Integrated tests into GitLab CI/CD pipelines to enable automated regression and environment-specific deployments. Managed containerized test execution within Kubernetes clusters to ensure scalability and environment parity across staging and production-like systems. Collaborated with product and engineering teams via Jira for test case tracking, defect management, and release validation. Focused on ensuring transactional integrity, risk controls, and performance reliability in a real-time trading environment.",
		platformLink: "https://www.valr.com/en/",
	},
];

export default function Projects() {
	return (
		<section className="bg-white py-24 dark:bg-neutral-900">
			<div className="container mx-auto max-w-6xl px-6">
				<h1 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
					Our Projects
				</h1>
				<p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600 dark:text-neutral-300">
					Examples of solutions we have delivered across web, mobile, and cloud platforms.
				</p>

				<div className="mt-12 flex flex-wrap justify-center gap-8">
					{projects.map((project) => (
						<div key={project.name} className="w-full md:w-[calc(50%-1rem)]">
						<Card
							className="h-full border-transparent bg-neutral-50 dark:bg-neutral-800/50"
						>
							<CardHeader>
								<CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
									 {project.name}
								</CardTitle>
							</CardHeader>

							<CardContent className="space-y-6">
								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Client:
									</h2>
									<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
										{project.client}
									</p>
								</div>

								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Technologies Used:
									</h2>
									<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
										{project.technologies.map((technology) => (
											<li key={technology}>{technology}</li>
										))}
									</ul>
								</div>

								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Project Overview:
									</h2>
									<p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
										{project.overview}
									</p>
								</div>

								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Platform Link:
									</h2>
									<a 
										href={project.platformLink}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
									>
										{project.platformLink}
									</a>
								</div>
							</CardContent>
						</Card>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
