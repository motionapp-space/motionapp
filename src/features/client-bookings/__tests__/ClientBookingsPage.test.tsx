import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientBookingsPage } from '../components/ClientBookingsPage';
import type { ClientAppointmentView } from '../types';
import type { ClientBookingSettings } from '../types';

// Mock hooks
vi.mock('../hooks/useClientBookingSettings', () => ({
  useClientBookingSettings: vi.fn()
}));

vi.mock('../hooks/useClientAppointmentsView', () => ({
  useClientAppointmentsView: vi.fn()
}));

vi.mock('../hooks/useClientRecentActivity', () => ({
  useClientRecentActivity: vi.fn()
}));

vi.mock('../hooks/useRespondToCounterProposal', () => ({
  useRespondToCounterProposal: vi.fn()
}));

// Import mocks
import { useClientBookingSettings } from '../hooks/useClientBookingSettings';
import { useClientAppointmentsView } from '../hooks/useClientAppointmentsView';
import { useClientRecentActivity } from '../hooks/useClientRecentActivity';
import { useRespondToCounterProposal } from '../hooks/useRespondToCounterProposal';

// Fixtures
const confirmedAppointmentFixture: ClientAppointmentView = {
  id: 'evt-1',
  type: 'event',
  status: 'CONFIRMED',
  title: 'Appuntamento',
  startAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  endAt: new Date(Date.now() + 86400000 + 3600000).toISOString(),
  canCancel: true,
};

const pendingRequestFixture: ClientAppointmentView = {
  id: 'req-1',
  type: 'booking_request',
  status: 'REQUESTED',
  title: 'Richiesta appuntamento',
  startAt: new Date(Date.now() + 172800000).toISOString(), // 2 days
  endAt: new Date(Date.now() + 172800000 + 3600000).toISOString(),
  canCancel: true,
};

const counterProposalFixture: ClientAppointmentView = {
  id: 'req-2',
  type: 'booking_request',
  status: 'COUNTER_PROPOSAL',
  title: 'Richiesta appuntamento',
  startAt: '2026-01-05T09:00:00Z', // Original requested time
  endAt: '2026-01-05T10:00:00Z',
  counterProposedStartAt: '2026-01-05T14:00:00Z', // Proposed time
  counterProposedEndAt: '2026-01-05T15:00:00Z',
  canCancel: true,
};

const approvedRequestFixture: ClientAppointmentView = {
  id: 'req-approved',
  type: 'booking_request',
  status: 'CANCELLED', // After fix, APPROVED maps to CANCELLED
  title: 'Appuntamento',
  startAt: new Date(Date.now() + 259200000).toISOString(),
  endAt: new Date(Date.now() + 259200000 + 3600000).toISOString(),
  canCancel: false,
};

// Create many confirmed appointments
const manyConfirmedAppointments: ClientAppointmentView[] = Array.from({ length: 5 }, (_, i) => ({
  id: `evt-${i + 1}`,
  type: 'event',
  status: 'CONFIRMED',
  title: 'Appuntamento',
  startAt: new Date(Date.now() + (86400000 * (i + 1))).toISOString(),
  endAt: new Date(Date.now() + (86400000 * (i + 1)) + 3600000).toISOString(),
  canCancel: true,
}));

// Helper to wrap component with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Helper to setup default mocks
function setupMocks(options: {
  settings?: Partial<ClientBookingSettings>;
  appointments?: ClientAppointmentView[];
  recentActivity?: any[];
  counterProposalHooks?: { accept?: () => void; reject?: () => void };
} = {}) {
  const defaultSettings: ClientBookingSettings = {
    enabled: true,
    cancelPolicyHours: 24,
    slotDurationMinutes: 60,
    minAdvanceNoticeHours: 24,
    maxFutureDays: null,
    bufferBetweenMinutes: 0,
    ...options.settings,
  };

  (useClientBookingSettings as any).mockReturnValue({
    data: defaultSettings,
    isLoading: false,
  });

  (useClientAppointmentsView as any).mockReturnValue({
    data: options.appointments ?? [],
    isLoading: false,
  });

  (useClientRecentActivity as any).mockReturnValue({
    data: options.recentActivity ?? [],
    isLoading: false,
  });

  const acceptMock = options.counterProposalHooks?.accept ?? vi.fn();
  const rejectMock = options.counterProposalHooks?.reject ?? vi.fn();
  
  (useRespondToCounterProposal as any).mockReturnValue({
    accept: acceptMock,
    reject: rejectMock,
    isPending: false,
  });

  return { acceptMock, rejectMock };
}

describe('ClientBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CTA Visibility', () => {
    it('shows booking CTA when self-service is enabled', () => {
      setupMocks({ settings: { enabled: true } });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.getByRole('button', { name: /prenota appuntamento/i })).toBeInTheDocument();
      expect(screen.getByText(/il coach confermerà/i)).toBeInTheDocument();
    });

    it('hides booking CTA and shows info text when self-service is disabled', () => {
      setupMocks({ settings: { enabled: false } });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.queryByRole('button', { name: /prenota/i })).not.toBeInTheDocument();
      expect(screen.getByText(/non sono abilitate/i)).toBeInTheDocument();
    });
  });

  describe('Next Appointment Hero', () => {
    it('renders hero card with next confirmed appointment', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const appointment: ClientAppointmentView = {
        ...confirmedAppointmentFixture,
        startAt: tomorrow.toISOString(),
      };
      
      setupMocks({ appointments: [appointment] });
      renderWithProviders(<ClientBookingsPage />);
      
      // Should show the day number
      const dayNumber = tomorrow.getDate().toString();
      expect(screen.getByText(dayNumber)).toBeInTheDocument();
    });

    it('renders empty state when no upcoming appointments', () => {
      setupMocks({ appointments: [] });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.getByText(/nessun appuntamento confermato/i)).toBeInTheDocument();
    });
  });

  describe('Active Requests Section', () => {
    it('shows COUNTER_PROPOSED before PENDING requests', () => {
      setupMocks({ 
        appointments: [pendingRequestFixture, counterProposalFixture] 
      });
      renderWithProviders(<ClientBookingsPage />);
      
      const cards = screen.getAllByTestId('request-card');
      expect(cards).toHaveLength(2);
      
      // First card should be counter proposal
      expect(within(cards[0]).getByText(/nuovo orario proposto/i)).toBeInTheDocument();
      // Second card should be pending
      expect(within(cards[1]).getByText(/richiesta inviata/i)).toBeInTheDocument();
    });

    it('calls accept handler when accepting counter proposal', async () => {
      const user = userEvent.setup();
      const { acceptMock } = setupMocks({ 
        appointments: [counterProposalFixture],
        counterProposalHooks: { accept: vi.fn() }
      });
      
      renderWithProviders(<ClientBookingsPage />);
      
      await user.click(screen.getByRole('button', { name: /accetta/i }));
      expect(acceptMock).toHaveBeenCalledWith(counterProposalFixture.id);
    });

    it('calls reject handler when rejecting counter proposal', async () => {
      const user = userEvent.setup();
      const { rejectMock } = setupMocks({ 
        appointments: [counterProposalFixture],
        counterProposalHooks: { reject: vi.fn() }
      });
      
      renderWithProviders(<ClientBookingsPage />);
      
      await user.click(screen.getByRole('button', { name: /rifiuta/i }));
      expect(rejectMock).toHaveBeenCalledWith(counterProposalFixture.id);
    });
  });

  describe('COUNTER_PROPOSED display', () => {
    it('shows proposed time, not original requested time', () => {
      setupMocks({ appointments: [counterProposalFixture] });
      renderWithProviders(<ClientBookingsPage />);
      
      // Should show the proposed time (14:00), not the original (09:00)
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
      expect(screen.queryByText(/09:00/)).not.toBeInTheDocument();
      
      // Should show the explanation copy
      expect(screen.getByText(/coach non.*disponibile/i)).toBeInTheDocument();
    });
  });

  describe('Future Appointments Preview', () => {
    it('shows max 3 future appointments (excluding hero)', () => {
      setupMocks({ appointments: manyConfirmedAppointments });
      renderWithProviders(<ClientBookingsPage />);
      
      // Hero shows 1st, preview shows next 3 (max)
      const futureCards = screen.getAllByTestId('future-card');
      expect(futureCards).toHaveLength(3);
    });

    it('shows "Vedi tutti" link when more than 3+1 appointments', () => {
      setupMocks({ appointments: manyConfirmedAppointments });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.getByRole('link', { name: /vedi tutti/i })).toBeInTheDocument();
    });

    it('uses dynamic title "Altri appuntamenti" when hero exists', () => {
      setupMocks({ appointments: manyConfirmedAppointments });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.getByText(/altri appuntamenti/i)).toBeInTheDocument();
    });

    it('does NOT show status badges on future appointment cards', () => {
      setupMocks({ appointments: manyConfirmedAppointments });
      renderWithProviders(<ClientBookingsPage />);
      
      // The word "Confermato" should NOT appear anywhere
      expect(screen.queryByText('Confermato')).not.toBeInTheDocument();
    });
  });

  describe('Recent Activity Section', () => {
    it('renders collapsed when there are declined/cancelled items', () => {
      const recentItems = [
        {
          id: 'act-1',
          activityType: 'declined_request' as const,
          date: new Date().toISOString(),
          originalDate: new Date().toISOString(),
          title: 'Richiesta rifiutata'
        }
      ];
      
      setupMocks({ recentActivity: recentItems });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.getByText(/attività recenti/i)).toBeInTheDocument();
    });

    it('does NOT render section when no recent activity', () => {
      setupMocks({ recentActivity: [] });
      renderWithProviders(<ClientBookingsPage />);
      
      expect(screen.queryByText(/attività recenti/i)).not.toBeInTheDocument();
    });
  });

  describe('APPROVED booking requests (anti-regression)', () => {
    it('never renders APPROVED booking_request as visible card', () => {
      // Even if an APPROVED request somehow reaches UI, it should be mapped to CANCELLED
      // and not appear in active sections
      setupMocks({ appointments: [approvedRequestFixture] });
      renderWithProviders(<ClientBookingsPage />);
      
      // Should not show any request cards
      expect(screen.queryByTestId('request-card')).not.toBeInTheDocument();
      // Should not show "Confermato" badge 
      expect(screen.queryByText('Confermato')).not.toBeInTheDocument();
    });
  });
});
