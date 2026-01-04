import React from "react";
import { render, fireEvent, waitFor } from "@/tests/utils/test-utils";
import { CreateSignScreen } from "@/src/features/signs/screens/CreateSignScreen";
import { signOfflineService } from "@/src/features/signs/services/SignOfflineService";
import { mockSignData } from "@/tests/utils/mock-data";

// Mock services
jest.mock("@/src/features/signs/services/SignOfflineService");
jest.mock("@/src/store/auth", () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: "user-123" },
  })),
}));

// Mock router
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
}));

describe("CreateSignScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form fields", () => {
    const { getByText, getByPlaceholderText } = render(<CreateSignScreen />);

    expect(getByText("Sign Type *")).toBeTruthy();
    expect(getByText("Condition *")).toBeTruthy();
    expect(getByPlaceholderText("40.7128")).toBeTruthy();
    expect(getByPlaceholderText("-74.0060")).toBeTruthy();
  });

  it("should create sign successfully", async () => {
    const mockSign = { id: "sign-123", ...mockSignData };
    (signOfflineService.createSign as jest.Mock).mockResolvedValue(mockSign);

    const { getByText, getByPlaceholderText } = render(<CreateSignScreen />);

    // Fill form
    fireEvent.changeText(getByPlaceholderText("40.7128"), "40.7128");
    fireEvent.changeText(getByPlaceholderText("-74.0060"), "-74.0060");

    // Submit
    const submitButton = getByText("Create Sign");
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(signOfflineService.createSign).toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("should show validation errors", () => {
    const { getByText } = render(<CreateSignScreen />);

    const submitButton = getByText("Create Sign");

    // Button should be disabled without valid data
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });
});
