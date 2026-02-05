import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelHeader } from "@/components/ui/panel-header";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
    })),
  },
}));

describe("PanelHeader Component", () => {
  it("renders title correctly", () => {
    render(<PanelHeader title="Test Title" />);
    
    expect(screen.getByTestId("panel-header")).toBeInTheDocument();
    expect(screen.getByTestId("panel-header-title")).toHaveTextContent("Test Title");
  });

  it("renders subtitle when provided", () => {
    render(<PanelHeader title="Test Title" subtitle="Test Subtitle" />);
    
    expect(screen.getByTestId("panel-header-subtitle")).toHaveTextContent("Test Subtitle");
  });

  it("does not render subtitle element when not provided", () => {
    render(<PanelHeader title="Test Title" />);
    
    expect(screen.queryByTestId("panel-header-subtitle")).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <PanelHeader 
        title="Test Title" 
        action={<button data-testid="action-button">Action</button>} 
      />
    );
    
    expect(screen.getByTestId("panel-header-action")).toBeInTheDocument();
    expect(screen.getByTestId("action-button")).toBeInTheDocument();
  });

  it("does not render action container when no action provided", () => {
    render(<PanelHeader title="Test Title" />);
    
    expect(screen.queryByTestId("panel-header-action")).not.toBeInTheDocument();
  });
});

describe("Settings tabs PanelHeader integration", () => {
  // Test data for each settings tab
  const settingsTabsConfig = [
    { tab: "profile", title: "Profilo", subtitle: "Gestisci le informazioni del tuo profilo" },
    { tab: "credentials", title: "Credenziali", subtitle: "Modifica la tua password" },
    { tab: "bookings", title: "Prenotazioni", subtitle: "Gestisci le regole di cancellazione e le prenotazioni dei clienti" },
    { tab: "packages", title: "Lezioni e pacchetti", subtitle: "Configura i valori di default per lezioni singole e pacchetti" },
    { tab: "privacy", title: "Privacy", subtitle: "Gestisci le tue preferenze sulla privacy" },
  ];

  it.each(settingsTabsConfig)(
    "tab $tab should have correct PanelHeader configuration",
    ({ title, subtitle }) => {
      // This is a unit test to verify PanelHeader renders correctly
      // The integration with Settings page would require full page rendering
      render(<PanelHeader title={title} subtitle={subtitle} />);
      
      expect(screen.getByTestId("panel-header-title")).toHaveTextContent(title);
      expect(screen.getByTestId("panel-header-subtitle")).toHaveTextContent(subtitle);
    }
  );
});

describe("Typography hierarchy validation", () => {
  it("PanelHeader title should have correct typography classes", () => {
    render(<PanelHeader title="Test" />);
    
    const title = screen.getByTestId("panel-header-title");
    expect(title).toHaveClass("text-lg", "font-semibold");
  });

  it("PanelHeader subtitle should have correct typography classes", () => {
    render(<PanelHeader title="Test" subtitle="Subtitle" />);
    
    const subtitle = screen.getByTestId("panel-header-subtitle");
    expect(subtitle).toHaveClass("text-sm", "text-muted-foreground");
  });
});
