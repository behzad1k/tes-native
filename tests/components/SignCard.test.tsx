import React from "react";
import { render, fireEvent } from "@/tests/utils/test-utils";
import { SignCard } from "@/src/features/signs/components/SignCard";
import { mockSign } from "@/tests/utils/mock-data";

describe("SignCard", () => {
  it("should render sign information", () => {
    const { getByText } = render(<SignCard sign={mockSign as any} />);

    expect(getByText("STOP")).toBeTruthy();
    expect(getByText("123 Main St")).toBeTruthy();
    expect(getByText("GOOD")).toBeTruthy();
  });

  it("should show synced status", () => {
    const { getByText } = render(<SignCard sign={mockSign as any} />);

    expect(getByText("Synced")).toBeTruthy();
  });

  it("should show pending status", () => {
    const pendingSign = { ...mockSign, status: "pending" };
    const { getByText } = render(<SignCard sign={pendingSign as any} />);

    expect(getByText("Pending Sync")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SignCard sign={mockSign as any} onPress={onPress} />,
    );

    fireEvent.press(getByText("STOP"));

    expect(onPress).toHaveBeenCalled();
  });
});
