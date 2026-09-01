import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectBlueprintApp } from "@/components/project-blueprint/app";

export const metadata: Metadata = {
  title: "Custom Software Cost Estimator",
  description:
    "Plan your custom product with confidence. Answer a few practical questions and receive a realistic budget range, delivery window, and recommended first phase. A planning estimate, not a fixed quote.",
  openGraph: {
    title: "Custom Software Cost Estimator | Good Code",
    description:
      "Project Blueprint helps you plan custom platforms, portals, mobile apps, and integrated systems with an indicative investment range.",
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
