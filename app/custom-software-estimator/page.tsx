import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectBlueprintApp } from "@/components/project-blueprint/app";

export const metadata: Metadata = {
  title: "Custom Software Cost Estimator",
  description:
    "Describe your custom product in your own words and receive a realistic budget range, delivery window, and recommended first phase. A planning estimate, not a fixed quote.",
  openGraph: {
    title: "Custom Software Cost Estimator | Good Code",
    description:
      "Project Blueprint turns a short product description into an indicative investment range for platforms, portals, mobile apps, and integrated systems.",
  },
};

export default function CustomSoftwareEstimatorPage() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-7xl px-6 py-20 text-neutral-600 dark:text-neutral-300">
            Loading Project Blueprint…
          </div>
        }
      >
        <ProjectBlueprintApp />
      </Suspense>
    </main>
  );
}
