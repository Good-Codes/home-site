import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Project = {
	name: string;
	technologies: string[];
	overview: string;
};

const projects: Project[] = [
	{
		name: "Retail Analytics Dashboard",
		technologies: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL"],
		overview:
			"A centralized dashboard for store managers to monitor sales, inventory, and conversion trends in real time.",
	},
	{
		name: "Booking Management Platform",
		technologies: ["React", "Node.js", "Express", "MongoDB"],
		overview:
			"A scheduling platform that automates reservations, reminders, and availability management for service teams.",
	},
	{
		name: "Field Service Mobile App",
		technologies: ["React Native", "Firebase", "Cloud Functions", "Stripe"],
		overview:
			"A mobile app that enables technicians to receive jobs, update task status, and collect secure payments onsite.",
	},
	{
		name: "Cloud Migration Toolkit",
		technologies: ["AWS", "Terraform", "Python", "Docker"],
		overview:
			"An internal toolkit that streamlines cloud migrations with automated infrastructure provisioning and validation scripts.",
	},
    {
        name: "E-commerce Personalization Engine",
        technologies: ["Python", "Django", "Redis", "Machine Learning"],
        overview:
            "A backend service that delivers personalized product recommendations and dynamic content based on user behavior and preferences.",
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

				<div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
					{projects.map((project) => (
						<Card
							key={project.name}
							className="h-full border-transparent bg-neutral-50 dark:bg-neutral-800/50"
						>
							<CardHeader>
								<CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
									Project: {project.name}
								</CardTitle>
							</CardHeader>

							<CardContent className="space-y-6">
								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Technologies Used
									</h2>
									<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
										{project.technologies.map((technology) => (
											<li key={technology}>{technology}</li>
										))}
									</ul>
								</div>

								<div>
									<h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
										Project Overview
									</h2>
									<p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
										{project.overview}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
