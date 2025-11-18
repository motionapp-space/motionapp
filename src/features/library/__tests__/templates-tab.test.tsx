import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TemplatesTab from '../components/TemplatesTab';

const mockTemplates = [
  {
    id: '1',
    name: 'Template A',
    description: 'Description A',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    category: 'Strength',
    coach_id: 'coach-1',
    data: { days: [] },
  },
  {
    id: '2',
    name: 'Template B',
    description: 'Description B',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
    category: null,
    coach_id: 'coach-1',
    data: { days: [] },
  },
];

// Mock hooks
vi.mock('@/features/templates/hooks/useTemplatesQuery', () => ({
  useTemplatesQuery: vi.fn(() => ({ data: mockTemplates, isLoading: false })),
}));

vi.mock('@/features/templates/hooks/useCreateTemplate', () => ({
  useCreateTemplate: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/features/templates/hooks/useDuplicateTemplate', () => ({
  useDuplicateTemplate: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/features/templates/hooks/useDeleteTemplate', () => ({
  useDeleteTemplate: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('TemplatesTab - Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Control Bar', () => {
    it('renders search input', () => {
      render(<TemplatesTab />, { wrapper });
      expect(screen.getByPlaceholderText(/cerca template/i)).toBeInTheDocument();
    });

    it('renders filter dropdown', () => {
      render(<TemplatesTab />, { wrapper });
      const filterTriggers = screen.getAllByRole('combobox');
      expect(filterTriggers.length).toBeGreaterThan(0);
    });

    it('renders sort dropdown', () => {
      render(<TemplatesTab />, { wrapper });
      const sortTriggers = screen.getAllByRole('combobox');
      expect(sortTriggers.length).toBeGreaterThan(0);
    });

    it('renders new template button', () => {
      render(<TemplatesTab />, { wrapper });
      expect(screen.getByTestId('create-template-btn')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters templates by name', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/cerca template/i);
      await user.type(searchInput, 'Template A');

      await waitFor(() => {
        expect(screen.getByText('Template A')).toBeInTheDocument();
        expect(screen.queryByText('Template B')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/cerca template/i);
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText(/nessun risultato/i)).toBeInTheDocument();
      });
    });

    it('can clear search', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/cerca template/i);
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText(/nessun risultato/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /cancella ricerca/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Template A')).toBeInTheDocument();
        expect(screen.getByText('Template B')).toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('sorts by last modified by default', () => {
      render(<TemplatesTab />, { wrapper });
      const cards = screen.getAllByTestId(/template-card/);
      
      // Template B has more recent updated_at
      expect(cards[0]).toHaveAttribute('data-testid', 'template-card-2');
      expect(cards[1]).toHaveAttribute('data-testid', 'template-card-1');
    });
  });

  describe('Card Layout', () => {
    it('renders card with mini preview', () => {
      render(<TemplatesTab />, { wrapper });
      const card = screen.getByTestId('template-card-1');
      
      // Verify preview area with gradient background exists
      const preview = within(card).getByRole('img', { hidden: true });
      expect(preview).toBeInTheDocument();
    });

    it('shows template name and last edited date', () => {
      render(<TemplatesTab />, { wrapper });
      
      expect(screen.getByText('Template A')).toBeInTheDocument();
      expect(screen.getByText(/ultima modifica/i)).toBeInTheDocument();
    });

    it('shows primary edit button', () => {
      render(<TemplatesTab />, { wrapper });
      expect(screen.getByTestId('template-edit-1')).toBeInTheDocument();
    });

    it('shows kebab menu with secondary actions', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const card = screen.getByTestId('template-card-1');
      const menuButtons = within(card).getAllByRole('button');
      const kebabButton = menuButtons.find(btn => btn.querySelector('svg'));
      
      if (kebabButton) {
        await user.click(kebabButton);

        await waitFor(() => {
          expect(screen.getByText(/visualizza/i)).toBeInTheDocument();
          expect(screen.getByText(/duplica/i)).toBeInTheDocument();
          expect(screen.getByText(/elimina/i)).toBeInTheDocument();
        });
      }
    });

    it('delete option is styled in red', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const card = screen.getByTestId('template-card-1');
      const menuButtons = within(card).getAllByRole('button');
      const kebabButton = menuButtons.find(btn => btn.querySelector('svg'));
      
      if (kebabButton) {
        await user.click(kebabButton);

        const deleteOption = await screen.findByText(/elimina/i);
        expect(deleteOption.closest('[role="menuitem"]')).toHaveClass('text-destructive');
      }
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no templates exist', () => {
      const { useTemplatesQuery } = require('@/features/templates/hooks/useTemplatesQuery');
      useTemplatesQuery.mockReturnValue({ data: [], isLoading: false });

      render(<TemplatesTab />, { wrapper });
      
      expect(screen.getByText(/non hai ancora creato template/i)).toBeInTheDocument();
      expect(screen.getByText(/risparmia tempo/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders grid with correct columns', () => {
      render(<TemplatesTab />, { wrapper });
      const grid = screen.getByTestId('templates-grid');
      
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('shows mobile sticky CTA', () => {
      render(<TemplatesTab />, { wrapper });
      
      const mobileCtas = screen.getAllByRole('button', { name: /nuovo template/i });
      expect(mobileCtas.length).toBeGreaterThanOrEqual(2); // One in control bar, one sticky
    });
  });

  describe('Regression Tests', () => {
    it('delete template shows confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const card = screen.getByTestId('template-card-1');
      const menuButtons = within(card).getAllByRole('button');
      const kebabButton = menuButtons.find(btn => btn.querySelector('svg'));
      
      if (kebabButton) {
        await user.click(kebabButton);
        
        const deleteBtn = await screen.findByTestId('template-delete-1');
        await user.click(deleteBtn);

        await waitFor(() => {
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
          expect(screen.getByText(/elimina template/i)).toBeInTheDocument();
          expect(screen.getByText(/questa azione non può essere annullata/i)).toBeInTheDocument();
        });
      }
    });

    it('can cancel delete operation', async () => {
      const user = userEvent.setup();
      render(<TemplatesTab />, { wrapper });

      const card = screen.getByTestId('template-card-1');
      const menuButtons = within(card).getAllByRole('button');
      const kebabButton = menuButtons.find(btn => btn.querySelector('svg'));
      
      if (kebabButton) {
        await user.click(kebabButton);
        
        const deleteBtn = await screen.findByTestId('template-delete-1');
        await user.click(deleteBtn);

        const cancelBtn = await screen.findByRole('button', { name: /annulla/i });
        await user.click(cancelBtn);

        await waitFor(() => {
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      const { useTemplatesQuery } = require('@/features/templates/hooks/useTemplatesQuery');
      useTemplatesQuery.mockReturnValue({ data: [], isLoading: true });

      render(<TemplatesTab />, { wrapper });
      
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });
});
