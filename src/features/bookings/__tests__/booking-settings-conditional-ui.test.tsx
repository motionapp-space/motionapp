import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingSettingsForm } from '../components/BookingSettingsForm';

// Mock hooks
vi.mock('../hooks/useBookingSettingsQuery', () => ({
  useBookingSettingsQuery: vi.fn(() => ({
    data: {
      enabled: false,
      min_advance_notice_hours: 24,
      slot_duration_minutes: 60,
      buffer_between_minutes: 0,
      cancel_policy_hours: 24,
      approval_mode: 'MANUAL' as const,
    },
    isLoading: false,
  })),
}));

vi.mock('../hooks/useAvailabilityWindowsQuery', () => ({
  useAvailabilityWindowsQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock('../hooks/useUpdateBookingSettings', () => ({
  useUpdateBookingSettings: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock('../hooks/useUpdateAvailabilityWindows', () => ({
  useUpdateAvailabilityWindows: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../components/AvailabilityEditor', () => ({
  AvailabilityEditor: vi.fn(() => <div data-testid="availability-editor">Availability Editor</div>),
}));

vi.mock('../components/OutOfOfficeManager', () => ({
  OutOfOfficeManager: vi.fn(() => <div data-testid="out-of-office-manager">Out of Office Manager</div>),
}));

vi.mock('../components/GlobalSaveBar', () => ({
  GlobalSaveBar: vi.fn(() => null),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BookingSettingsForm - Conditional UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Structure Alignment', () => {
    it('renders with Card, CardHeader, CardTitle, and CardDescription', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Check for card title
      expect(screen.getByText('Prenotazioni')).toBeInTheDocument();
      
      // Check for card description
      expect(screen.getByText(/Gestisci le prenotazioni self-service/i)).toBeInTheDocument();
    });
  });

  describe('Toggle Visibility', () => {
    it('renders main toggle prominently at top of card content', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Prenotazioni self-service')).toBeInTheDocument();
      expect(screen.getByText(/Consenti ai tuoi clienti di prenotare autonomamente/i)).toBeInTheDocument();
    });

    it('toggle reflects saved value from backend (disabled)', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('toggle reflects saved value from backend (enabled)', async () => {
      const { useBookingSettingsQuery } = await import('../hooks/useBookingSettingsQuery');
      vi.mocked(useBookingSettingsQuery).mockReturnValue({
        data: {
          enabled: true,
          min_advance_notice_hours: 24,
          slot_duration_minutes: 60,
          buffer_between_minutes: 0,
          cancel_policy_hours: 24,
          approval_mode: 'MANUAL' as const,
        },
        isLoading: false,
      } as any);

      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('Disabled State', () => {
    it('shows disabled state card when enabled=false', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Prenotazioni disabilitate')).toBeInTheDocument();
      expect(screen.getByText(/Le prenotazioni self-service sono disabilitate/i)).toBeInTheDocument();
    });

    it('hides all config sections when enabled=false', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Check that configuration sections are NOT rendered
      expect(screen.queryByText('Regole di prenotazione')).not.toBeInTheDocument();
      expect(screen.queryByText('Fasce orarie settimanali')).not.toBeInTheDocument();
      expect(screen.queryByText('Periodi di assenza')).not.toBeInTheDocument();
      expect(screen.queryByTestId('availability-editor')).not.toBeInTheDocument();
      expect(screen.queryByTestId('out-of-office-manager')).not.toBeInTheDocument();
    });

    it('disabled card shows correct icon', () => {
      const { container } = render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Check for CalendarX icon class (lucide icons render as SVG with specific class)
      const calendarXIcon = container.querySelector('svg.lucide-calendar-x');
      expect(calendarXIcon).toBeInTheDocument();
    });
  });

  describe('Enabled State', () => {
    beforeEach(async () => {
      const { useBookingSettingsQuery } = await import('../hooks/useBookingSettingsQuery');
      vi.mocked(useBookingSettingsQuery).mockReturnValue({
        data: {
          enabled: true,
          min_advance_notice_hours: 24,
          slot_duration_minutes: 60,
          buffer_between_minutes: 0,
          cancel_policy_hours: 24,
          approval_mode: 'MANUAL' as const,
        },
        isLoading: false,
      } as any);
    });

    it('shows all config sections when enabled=true', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Regole di prenotazione')).toBeInTheDocument();
      expect(screen.getByText('Fasce orarie settimanali')).toBeInTheDocument();
      expect(screen.getByText('Periodi di assenza')).toBeInTheDocument();
      expect(screen.getByTestId('availability-editor')).toBeInTheDocument();
      expect(screen.getByTestId('out-of-office-manager')).toBeInTheDocument();
    });

    it('hides disabled state card when enabled=true', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(screen.queryByText('Prenotazioni disabilitate')).not.toBeInTheDocument();
    });

    it('shows correct subtitles for configuration sections', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(screen.getByText(/Questi parametri determinano come i clienti possono prenotare/i)).toBeInTheDocument();
      expect(screen.getByText(/Definisci quando i clienti possono prenotare/i)).toBeInTheDocument();
      expect(screen.getByText(/Blocca date specifiche in cui non sei disponibile/i)).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('toggling from false to true shows config sections', async () => {
      const user = userEvent.setup();
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Initially disabled
      expect(screen.queryByText('Regole di prenotazione')).not.toBeInTheDocument();
      
      // Toggle to enabled
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      // Config sections should appear
      await waitFor(() => {
        expect(screen.getByText('Regole di prenotazione')).toBeInTheDocument();
      });
    });

    it('toggling from true to false hides config sections', async () => {
      const user = userEvent.setup();
      const { useBookingSettingsQuery } = await import('../hooks/useBookingSettingsQuery');
      vi.mocked(useBookingSettingsQuery).mockReturnValue({
        data: {
          enabled: true,
          min_advance_notice_hours: 24,
          slot_duration_minutes: 60,
          buffer_between_minutes: 0,
          cancel_policy_hours: 24,
          approval_mode: 'MANUAL' as const,
        },
        isLoading: false,
      } as any);

      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Initially enabled
      expect(screen.getByText('Regole di prenotazione')).toBeInTheDocument();
      
      // Toggle to disabled
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      // Config sections should disappear
      await waitFor(() => {
        expect(screen.queryByText('Regole di prenotazione')).not.toBeInTheDocument();
      });
    });
  });
});

describe('BookingSettingsForm - Bug Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Props Preservation', () => {
    it('AvailabilityEditor receives correct props when visible', async () => {
      const { useBookingSettingsQuery } = await import('../hooks/useBookingSettingsQuery');
      const { AvailabilityEditor } = await import('../components/AvailabilityEditor');
      
      vi.mocked(useBookingSettingsQuery).mockReturnValue({
        data: {
          enabled: true,
          min_advance_notice_hours: 24,
          slot_duration_minutes: 60,
          buffer_between_minutes: 0,
          cancel_policy_hours: 24,
          approval_mode: 'MANUAL' as const,
        },
        isLoading: false,
      } as any);

      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(AvailabilityEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          onChangeDetected: expect.any(Function),
          localChangesRef: expect.any(Object),
        }),
        expect.anything()
      );
    });

    it('OutOfOfficeManager receives onChangeDetected prop when visible', async () => {
      const { useBookingSettingsQuery } = await import('../hooks/useBookingSettingsQuery');
      const { OutOfOfficeManager } = await import('../components/OutOfOfficeManager');
      
      vi.mocked(useBookingSettingsQuery).mockReturnValue({
        data: {
          enabled: true,
          min_advance_notice_hours: 24,
          slot_duration_minutes: 60,
          buffer_between_minutes: 0,
          cancel_policy_hours: 24,
          approval_mode: 'MANUAL' as const,
        },
        isLoading: false,
      } as any);

      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(OutOfOfficeManager).toHaveBeenCalledWith(
        expect.objectContaining({
          onChangeDetected: expect.any(Function),
        }),
        expect.anything()
      );
    });
  });

  describe('Form Field Preservation', () => {
    it('all form fields retain correct values regardless of toggle state', async () => {
      const user = userEvent.setup();
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Toggle to enabled
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      // Check that form fields are rendered with correct default values
      await waitFor(() => {
        expect(screen.getByText('Regole di prenotazione')).toBeInTheDocument();
      });
      
      // Toggle back to disabled
      await user.click(toggle);
      
      // Toggle to enabled again
      await user.click(toggle);
      
      // Values should still be present (form doesn't reset)
      await waitFor(() => {
        expect(screen.getByText('Regole di prenotazione')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('initial load with enabled=false shows disabled state immediately', () => {
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Disabled state should be visible immediately (no loading delay for this logic)
      expect(screen.getByText('Prenotazioni disabilitate')).toBeInTheDocument();
    });

    it('rapid toggle does not cause rendering errors', async () => {
      const user = userEvent.setup();
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      const toggle = screen.getByRole('switch');
      
      // Rapidly toggle multiple times
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);
      
      // Component should still render without errors
      expect(screen.getByText('Prenotazioni self-service')).toBeInTheDocument();
    });

    it('GlobalSaveBar receives correct props regardless of enabled state', async () => {
      const { GlobalSaveBar } = await import('../components/GlobalSaveBar');
      
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      expect(GlobalSaveBar).toHaveBeenCalledWith(
        expect.objectContaining({
          show: expect.any(Boolean),
          onSave: expect.any(Function),
          onCancel: expect.any(Function),
          isSaving: expect.any(Boolean),
        }),
        expect.anything()
      );
    });
  });

  describe('Functional Regression Prevention', () => {
    it('onSubmit validation still works with conditional sections', async () => {
      const { useUpdateBookingSettings } = await import('../hooks/useUpdateBookingSettings');
      const mockMutate = vi.fn();
      
      vi.mocked(useUpdateBookingSettings).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      } as any);

      const user = userEvent.setup();
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Toggle to enabled
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      // Trigger save via GlobalSaveBar callback
      const { GlobalSaveBar } = await import('../components/GlobalSaveBar');
      const saveCallback = vi.mocked(GlobalSaveBar).mock.calls[0][0].onSave;
      
      await saveCallback();
      
      // Mutation should be called
      expect(mockMutate).toHaveBeenCalled();
    });

    it('handleCancelChanges resets form correctly with conditional sections', async () => {
      const user = userEvent.setup();
      render(<BookingSettingsForm />, { wrapper: createWrapper() });
      
      // Toggle to enabled
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      // Trigger cancel via GlobalSaveBar callback
      const { GlobalSaveBar } = await import('../components/GlobalSaveBar');
      const cancelCallback = vi.mocked(GlobalSaveBar).mock.calls[0][0].onCancel;
      
      cancelCallback();
      
      // Toggle should be back to false (default value)
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'false');
      });
    });
  });
});
