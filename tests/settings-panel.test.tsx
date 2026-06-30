import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "@/components/SettingsPanel";
import { createTestUploadConfig } from "@/tests/helpers/config";

const config = createTestUploadConfig();

describe("SettingsPanel", () => {
  it("renders credential and queue sections", () => {
    render(<SettingsPanel config={config} onChange={() => undefined} />);

    expect(screen.getByRole("heading", { name: /credential profiles/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/profile name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parallel uploads/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /credential vault/i })).toBeInTheDocument();
  });

  it("uses responsive settings layout hooks", () => {
    const { container } = render(
      <SettingsPanel config={config} onChange={() => undefined} />,
    );

    expect(container.querySelector(".settings-panel")).toBeTruthy();
    expect(container.querySelector(".settings-api-key-row")).toBeTruthy();
    expect(container.querySelector(".settings-actions")).toBeTruthy();
  });

  it("updates profile label on change", () => {
    const onChange = vi.fn();

    render(<SettingsPanel config={config} onChange={onChange} />);

    const nameInput = screen.getByPlaceholderText(/main group, personal account/i);
    fireEvent.change(nameInput, { target: { value: "UGC Group" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as UploadConfig;
    expect(lastCall.profiles[0]?.label).toBe("UGC Group");
  });

  it("shows export key confirmation step", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel config={config} onChange={() => undefined} />);

    await user.click(screen.getAllByRole("button", { name: /export with api keys/i })[0]!);
    expect(
      screen.getAllByRole("button", { name: /confirm — keys will be in plaintext json/i })[0],
    ).toBeInTheDocument();
  });
});
