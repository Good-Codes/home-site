/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
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

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ProfileIncompleteNudge } from "@/components/account/profile-incomplete-nudge";
import { profileNudgeDismissKey } from "@/lib/account/profile-nudge";
import type { CustomerProfile } from "@/lib/account/profile";

const incompleteProfile: CustomerProfile = {
  email: "ada@example.com",
  name: "Ada Lovelace",
  phone: null,
  preferredContact: null,
  organisation: null,
  jobTitle: null,
  city: null,
  province: null,
  organisationType: null,
  industry: null,
  teamSize: null,
  referralSource: null,
};

const completeProfile: CustomerProfile = {
  ...incompleteProfile,
  phone: "082 000 0000",
  organisation: "Acme",
};

function mockCustomerSession() {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: {
        id: "user-1",
        role: "CUSTOMER",
        email: "ada@example.com",
        name: "Ada Lovelace",
      },
    },
    status: "authenticated",
    update: vi.fn(),
  } as never);
}

describe("ProfileIncompleteNudge", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  beforeEach(() => {
    vi.mocked(useSession).mockReset();
    vi.mocked(usePathname).mockReset();
    vi.mocked(usePathname).mockReturnValue("/");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("prompts a signed-in customer with an incomplete profile", async () => {
    mockCustomerSession();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ profile: incompleteProfile }), {
        status: 200,
      }),
    );

    render(<ProfileIncompleteNudge />);

    const heading = await screen.findByText(/Finish your profile/i);
    expect(heading).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Complete profile/i }).getAttribute("href"),
    ).toBe("/account");
  });

  it("stays hidden when the profile is already complete", async () => {
    mockCustomerSession();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ profile: completeProfile }), {
        status: 200,
      }),
    );

    render(<ProfileIncompleteNudge />);

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/account/profile");
    });
    expect(screen.queryByText(/Finish your profile/i)).toBeNull();
  });

  it("does not prompt staff or guests", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      },
      status: "authenticated",
      update: vi.fn(),
    } as never);

    render(<ProfileIncompleteNudge />);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/Finish your profile/i)).toBeNull();
  });

  it("does not show on the account page", async () => {
    mockCustomerSession();
    vi.mocked(usePathname).mockReturnValue("/account");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ profile: incompleteProfile }), {
        status: 200,
      }),
    );

    render(<ProfileIncompleteNudge />);
    await vi.waitFor(() => {
      expect(screen.queryByText(/Finish your profile/i)).toBeNull();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("dismisses for the rest of the session", async () => {
    mockCustomerSession();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ profile: incompleteProfile }), {
        status: 200,
      }),
    );

    render(<ProfileIncompleteNudge />);
    expect(
      await screen.findByText(/Finish your profile/i),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Dismiss profile reminder/i }),
    );

    expect(screen.queryByText(/Finish your profile/i)).toBeNull();
    expect(window.sessionStorage.getItem(profileNudgeDismissKey("user-1"))).toBe(
      "1",
    );
  });
});
