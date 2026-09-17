/** @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }: React.ComponentProps<"section">) => (
      <section {...props}>{children}</section>
    ),
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AccountDeleted } from "@/components/account/account-deleted";

describe("AccountDeleted", () => {
  afterEach(() => {
    cleanup();
  });

  it("confirms deletion and links back home", () => {
    render(<AccountDeleted />);

    expect(
      screen.getByRole("heading", { name: /Profile removed/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Your sign-in and profile have been deleted/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Back to Home/i }).getAttribute("href"),
    ).toBe("/");
  });
});
