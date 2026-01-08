import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingRequestListItem } from "../BookingRequestListItem";
import type { BookingRequestWithClient, AvailableSlot } from "../../types";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockPendingRequest: BookingRequestWithClient = {
  id: "req-1",
  coach_client_id: "cc-1",
  requested_start_at: "2024-01-15T16:00:00.000Z",
  requested_end_at: "2024-01-15T17:00:00.000Z",
  status: "PENDING",
  notes: null,
  counter_proposal_start_at: null,
  counter_proposal_end_at: null,
  event_id: null,
  finalized_start_at: null,
  finalized_end_at: null,
  approved_at: null,
  created_at: "2024-01-14T10:00:00.000Z",
  updated_at: "2024-01-14T10:00:00.000Z",
  client_name: "Mario Rossi",
};

const mockCounterProposedRequest: BookingRequestWithClient = {
  ...mockPendingRequest,
  id: "req-2",
  status: "COUNTER_PROPOSED",
  counter_proposal_start_at: "2024-01-16T10:00:00.000Z",
  counter_proposal_end_at: "2024-01-16T11:00:00.000Z",
};

const mockAlternatives: AvailableSlot[] = [
  { start: "2024-01-16T09:00:00.000Z", end: "2024-01-16T10:00:00.000Z" },
  { start: "2024-01-16T10:00:00.000Z", end: "2024-01-16T11:00:00.000Z" },
  { start: "2024-01-16T14:00:00.000Z", end: "2024-01-16T15:00:00.000Z" },
];

describe("BookingRequestListItem", () => {
  const mockOnApprove = vi.fn();
  const mockOnDecline = vi.fn();
  const mockOnCounterPropose = vi.fn();
  const mockLoadAlternatives = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnApprove.mockResolvedValue(undefined);
    mockOnDecline.mockResolvedValue(undefined);
    mockOnCounterPropose.mockResolvedValue(undefined);
    mockLoadAlternatives.mockResolvedValue(mockAlternatives);
  });

  const renderItem = (request: BookingRequestWithClient) =>
    render(
      <BookingRequestListItem
        request={request}
        onApprove={mockOnApprove}
        onDecline={mockOnDecline}
        onCounterPropose={mockOnCounterPropose}
        loadAlternatives={mockLoadAlternatives}
      />
    );

  describe("Rendering", () => {
    it("renders pending request with client name and date", () => {
      renderItem(mockPendingRequest);

      expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
      expect(screen.getByText(/In attesa/)).toBeInTheDocument();
    });

    it("renders action buttons for pending requests", () => {
      renderItem(mockPendingRequest);

      expect(screen.getByRole("button", { name: /Approva/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Proponi altro orario/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Rifiuta/i })).toBeInTheDocument();
    });

    it("renders counter-proposed request with proposal info", () => {
      renderItem(mockCounterProposedRequest);

      expect(screen.getByText(/Proposta inviata:/)).toBeInTheDocument();
      expect(screen.getByText(/Richiesta originale:/)).toBeInTheDocument();
      expect(screen.getByText(/In attesa cliente/)).toBeInTheDocument();
    });

    it("does not render action buttons for counter-proposed requests", () => {
      renderItem(mockCounterProposedRequest);

      expect(screen.queryByRole("button", { name: /Approva/i })).not.toBeInTheDocument();
    });
  });

  describe("Approve action", () => {
    it("calls onApprove when Approva button is clicked", async () => {
      renderItem(mockPendingRequest);

      const approveBtn = screen.getByRole("button", { name: /Approva/i });
      await userEvent.click(approveBtn);

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });
  });

  describe("Decline action with inline confirmation", () => {
    it("shows inline confirmation when Rifiuta is clicked", async () => {
      renderItem(mockPendingRequest);

      const declineBtn = screen.getByRole("button", { name: /Rifiuta/i });
      await userEvent.click(declineBtn);

      expect(screen.getByText(/Rifiutare la richiesta\?/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Annulla/i })).toBeInTheDocument();
    });

    it("calls onDecline when confirmed", async () => {
      renderItem(mockPendingRequest);

      // First click to show confirmation
      await userEvent.click(screen.getByRole("button", { name: /Rifiuta/i }));
      
      // Confirm decline
      const confirmBtn = screen.getAllByRole("button", { name: /Rifiuta/i })[0];
      await userEvent.click(confirmBtn);

      expect(mockOnDecline).toHaveBeenCalledTimes(1);
    });

    it("cancels confirmation when Annulla is clicked", async () => {
      renderItem(mockPendingRequest);

      await userEvent.click(screen.getByRole("button", { name: /Rifiuta/i }));
      await userEvent.click(screen.getByRole("button", { name: /Annulla/i }));

      // Back to normal buttons
      expect(screen.queryByText(/Rifiutare la richiesta\?/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Approva/i })).toBeInTheDocument();
    });

    it("closes confirmation on Escape key", async () => {
      renderItem(mockPendingRequest);

      await userEvent.click(screen.getByRole("button", { name: /Rifiuta/i }));
      expect(screen.getByText(/Rifiutare la richiesta\?/)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByText(/Rifiutare la richiesta\?/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Counter-propose with lazy alternatives", () => {
    it("loads alternatives only when accordion is opened", async () => {
      renderItem(mockPendingRequest);

      // Not loaded initially
      expect(mockLoadAlternatives).not.toHaveBeenCalled();

      // Click to open
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      expect(mockLoadAlternatives).toHaveBeenCalledTimes(1);
    });

    it("shows loading state while fetching alternatives", async () => {
      mockLoadAlternatives.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAlternatives), 100))
      );

      renderItem(mockPendingRequest);
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      expect(screen.getByText(/Caricamento orari.../)).toBeInTheDocument();
    });

    it("shows alternatives after loading", async () => {
      renderItem(mockPendingRequest);
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      await waitFor(() => {
        expect(screen.getByText(/Orari alternativi suggeriti/)).toBeInTheDocument();
      });
    });

    it("enables Invia proposta button only when a slot is selected", async () => {
      renderItem(mockPendingRequest);
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      await waitFor(() => {
        expect(screen.getByText(/Orari alternativi suggeriti/)).toBeInTheDocument();
      });

      const sendBtn = screen.getByRole("button", { name: /Invia proposta/i });
      expect(sendBtn).toBeDisabled();

      // Select a slot
      const slotButtons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("rounded-lg border")
      );
      if (slotButtons.length > 0) {
        await userEvent.click(slotButtons[0]);
        expect(sendBtn).not.toBeDisabled();
      }
    });

    it("calls onCounterPropose with selected slot", async () => {
      renderItem(mockPendingRequest);
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      await waitFor(() => {
        expect(screen.getByText(/Orari alternativi suggeriti/)).toBeInTheDocument();
      });

      // Select first slot
      const slotButtons = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("rounded-lg border")
      );
      if (slotButtons.length > 0) {
        await userEvent.click(slotButtons[0]);
        await userEvent.click(screen.getByRole("button", { name: /Invia proposta/i }));

        expect(mockOnCounterPropose).toHaveBeenCalledWith(
          mockAlternatives[0].start,
          mockAlternatives[0].end
        );
      }
    });

    it("closes accordion on Escape key", async () => {
      renderItem(mockPendingRequest);
      await userEvent.click(screen.getByRole("button", { name: /Proponi altro orario/i }));

      await waitFor(() => {
        expect(screen.getByText(/Orari alternativi suggeriti/)).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByText(/Orari alternativi suggeriti/)).not.toBeInTheDocument();
      });
    });
  });
});
