import type { Metadata } from "next";
import Projects from "@/components/projects";

export const metadata: Metadata = {
  title: "Our Projects",
  description:
    "Browse the portfolio of web, mobile, and cloud projects delivered by Good Code for clients across South Africa.",
};

export default function ProjectsPage() {
	return <Projects />;
}
