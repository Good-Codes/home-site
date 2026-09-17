/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { DeleteAccountCard } from "@/components/account/delete-account-card";
import { signOut } from "next-auth/react";

describe("DeleteAccountCard", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(signOut).mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
  });

  it("requires a confirmation click before deleting", async () => {
    render(<DeleteAccountCard />);
    expect(screen.queryByRole("button", { name: /confirm deletion/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.getByRole("button", { name: /confirm deletion/i })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm deletion/i }));
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/account", { method: "DELETE" });
    });
    await vi.waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/account-deleted" });
    });
  });
});
