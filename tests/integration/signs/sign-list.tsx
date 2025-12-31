import React from "react";
import { render, waitFor } from "@/tests/utils/test-utils";
import { SignsListScreen } from "@/src/features/signs/screens/SignsListScreen";
import { mockSign } from "@/tests/utils/mock-data";

// Mock hooks
jest.mock("@/src/features/signs/hooks/useSigns", () => ({
  useSigns: jest.fn(() => [mockSign]),
  usePendingSigns: jest.fn(() => []),
}));

jest.mock("@/src/store/sync", () => ({
  useSyncStore: jest.fn(() => ({
    isOnline: true,
    isSyncing: false,
  })),
}));

describe("SignsListScreen", () => {
  it("should render sign list", async () => {
    const { getByText } = render(<SignsListScreen />);

    await waitFor(() => {
      expect(getByText("STOP")).toBeTruthy();
      expect(getByText("123 Main St")).toBeTruthy();
    });
  });

  it("should show online status", () => {
    const { getByText } = render(<SignsListScreen />);

    expect(getByText("Online")).toBeTruthy();
  });

  it("should show create button", () => {
    const { getByText } = render(<SignsListScreen />);

    expect(getByText("New Sign")).toBeTruthy();
  });
});
