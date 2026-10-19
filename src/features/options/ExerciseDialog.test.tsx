import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/context/I18nContext";
import { FeedbackProvider } from "@/components/common/Feedback";
import { ExerciseDialog } from "@/features/options/ExerciseDialog";
import { VestingBar } from "@/features/options/VestingBar";
import type { VestingStatus } from "@/api/types";

// A plain function, not vi.fn(): vitest reports a mock's rejected result as unhandled even when the caller handles it.
const calls: unknown[][] = [];
let respond: () => Promise<unknown> = async () => ({});
vi.mock("@/api", () => ({
  api: {
    exerciseOptions: (...a: unknown[]) => {
      calls.push(a);
      return respond();
    },
  },
  isPendingChange: () => false,
}));

const grant: VestingStatus = {
  id: "g1",
  certificateNo: "FRT-000016",
  shareholderId: "h1",
  holderNameEn: "Mariam Al Suwaidi",
  holderNameAr: null,
  shareClassName: "Ordinary",
  strikePrice: 2.5,
  currency: "AED",
  granted: 4800,
  exercised: 0,
  vested: 1200,
  exercisable: 1200,
  unvested: 3600,
  startDate: "2025-01-01",
  cliffMonths: 12,
  vestingMonths: 48,
  cliffDate: "2026-01-01",
  fullyVestedDate: "2029-01-01",
  nextVestDate: "2026-12-01",
};

const wrap = (ui: React.ReactElement) =>
  render(
    <I18nProvider>
      <FeedbackProvider>{ui}</FeedbackProvider>
    </I18nProvider>,
  );

beforeEach(() => {
  calls.length = 0;
  respond = async () => ({});
});

describe("ExerciseDialog", () => {
  it("has no inline form: the dialog opens from one button", () => {
    wrap(<ExerciseDialog s={grant} orgId="o" classes={[]} onDone={() => {}} />);
    expect(screen.queryByLabelText("Quantity")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Exercise options" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Quantity")).toBeTruthy();
  });

  it("is disabled when nothing has vested", () => {
    wrap(<ExerciseDialog s={{ ...grant, exercisable: 0 }} orgId="o" classes={[]} onDone={() => {}} />);
    expect((screen.getByRole("button", { name: "Exercise options" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the cost and refuses more than has vested", () => {
    wrap(<ExerciseDialog s={grant} orgId="o" classes={[]} onDone={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Exercise options" }));
    const submit = screen.getByRole("button", { name: "Exercise" }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100" } });
    expect(screen.getByText("AED 250")).toBeTruthy();
    expect(submit.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "1201" } });
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    expect((screen.getByLabelText("Quantity") as HTMLInputElement).value).toBe("1200");
    expect(submit.disabled).toBe(false);
  });

  it("sends the exercise and reports back", async () => {
    const onDone = vi.fn();
    wrap(<ExerciseDialog s={grant} orgId="o" classes={[]} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Exercise options" }));
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Exercise" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(calls).toEqual([["o", "FRT-000016", { quantity: 300, shareClassId: undefined }]]);
  });

  it("keeps the dialog open and shows the server's reason when it is refused", async () => {
    respond = async () => {
      throw new Error("Only 10 options are exercisable");
    };
    wrap(<ExerciseDialog s={grant} orgId="o" classes={[]} onDone={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Exercise options" }));
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Exercise" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Only 10 options are exercisable");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("VestingBar", () => {
  it("draws a cliff marker at cliff / total months and one segment per state", () => {
    const { container } = wrap(<VestingBar s={grant} />);
    expect(screen.getByText("Cliff")).toBeTruthy();
    const marker = screen.getByText("Cliff").closest("span[tabindex]") as HTMLElement;
    expect(marker.style.insetInlineStart).toBe("25%");
    expect(container.querySelectorAll('[role="img"] > div')).toHaveLength(3);
  });

  it("has no cliff marker for a grant without a cliff", () => {
    wrap(<VestingBar s={{ ...grant, cliffMonths: 0 }} />);
    expect(screen.queryByText("Cliff")).toBeNull();
  });
});
