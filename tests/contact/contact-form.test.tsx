/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }: React.ComponentProps<"section">) => (
      <section {...props}>{children}</section>
    ),
    form: ({ children, ...props }: React.ComponentProps<"form">) => (
      <form {...props}>{children}</form>
    ),
    div: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.ComponentProps<"p">) => (
      <p {...props}>{children}</p>
    ),
  },
}));

import Contact from "@/components/contact";

const savedEstimates = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    savedToProfileAt: new Date().toISOString(),
    productSummary: "Comprehensive Fitness Application",
    rangeLabel: "R800k–R1.8m",
  },
];

describe("Contact form", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "ok" }), { status: 200 })),
    );
  });

  it("shows name, email, and phone for visitors without saved estimates", () => {
    render(<Contact savedEstimates={[]} />);
    expect(screen.getByLabelText(/name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/phone/i)).toBeTruthy();
    expect(screen.getByLabelText(/project details/i)).toBeTruthy();
    expect(screen.queryByLabelText(/saved estimate/i)).toBeNull();
  });

  it("hides contact fields and lists saved estimates for signed-in customers", () => {
    render(<Contact savedEstimates={savedEstimates} />);
    expect(screen.queryByLabelText(/^name/i)).toBeNull();
    expect(screen.queryByLabelText(/^email/i)).toBeNull();
    expect(screen.queryByLabelText(/^phone/i)).toBeNull();
    expect(screen.getByLabelText(/saved estimate/i)).toBeTruthy();
    expect(
      screen.getByRole("option", { name: /Comprehensive Fitness Application/ }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(/project details/i).closest("div")?.classList.contains("hidden"),
    ).toBe(true);
  });

  it("shows project details when no estimate is selected", () => {
    render(<Contact savedEstimates={savedEstimates} />);
    fireEvent.change(screen.getByLabelText(/saved estimate/i), {
      target: { value: "none" },
    });
    const details = screen.getByLabelText(/project details/i);
    expect(details.closest("div")?.classList.contains("hidden")).toBe(false);
  });
});
