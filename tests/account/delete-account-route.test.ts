import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/project-blueprint/auth/admin", () => ({
  requireCustomer: vi.fn(),
}));

vi.mock("@/lib/account/delete-account", () => ({
  DeleteAccountError: class DeleteAccountError extends Error {
    constructor(
      message: string,
      readonly code: "NOT_FOUND" | "FORBIDDEN" | "UNAVAILABLE",
    ) {
      super(message);
      this.name = "DeleteAccountError";
    }
  },
  deleteCustomerAccount: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/rate-limit")>(
    "@/lib/auth/rate-limit",
  );
  return {
    ...actual,
    checkAuthRateLimit: vi.fn(() => true),
  };
});

import { DELETE } from "@/app/api/account/route";
import { deleteCustomerAccount } from "@/lib/account/delete-account";
import { requireCustomer } from "@/lib/project-blueprint/auth/admin";

const customer = {
  ok: true as const,
  user: {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    role: "CUSTOMER" as const,
  },
};

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.mocked(requireCustomer).mockReset();
    vi.mocked(deleteCustomerAccount).mockReset();
  });

  it("returns 403 for staff sessions", async () => {
    vi.mocked(requireCustomer).mockResolvedValue({
      ok: false,
      status: 403,
      error: "Customer access required.",
    });

    const response = await DELETE(
      new Request("http://localhost/api/account", { method: "DELETE" }),
    );
    expect(response.status).toBe(403);
    expect(deleteCustomerAccount).not.toHaveBeenCalled();
  });

  it("deletes the customer account", async () => {
    vi.mocked(requireCustomer).mockResolvedValue(customer);
    vi.mocked(deleteCustomerAccount).mockResolvedValue();

    const response = await DELETE(
      new Request("http://localhost/api/account", { method: "DELETE" }),
    );
    expect(response.status).toBe(200);
    expect(deleteCustomerAccount).toHaveBeenCalledWith("user-1");
  });
});
