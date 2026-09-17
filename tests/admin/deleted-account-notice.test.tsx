/** @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DeletedAccountNotice } from "@/components/admin/deleted-account-notice";

describe("DeletedAccountNotice", () => {
  afterEach(() => {
    cleanup();
  });

  it("explains that the creator deleted their account", () => {
    render(<DeletedAccountNotice />);
    expect(
      screen.getByText(/The person who created this estimate has deleted their account/i),
    ).toBeTruthy();
  });

  it("renders a compact inbox flag", () => {
    render(<DeletedAccountNotice compact />);
    expect(screen.getByText(/Account deleted/i)).toBeTruthy();
  });
});
