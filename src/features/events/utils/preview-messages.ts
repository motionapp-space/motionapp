/**
 * FASE 1: Preview mode messages and utilities - Updated
 * Centralized messages for calendar preview functionality
 */

export const PREVIEW_MESSAGES = {
  BLOCKED_ACTION: "Questa è una simulazione della vista cliente. Per creare un appuntamento passa alla modalità Professionista.",
  
  GENERIC_CLIENT_BANNER: {
    title: "Modalità simulazione cliente",
    description: "Stai visualizzando il calendario come cliente. Le regole di prenotazione e disponibilità sono attive.",
  },
  
  SPECIFIC_CLIENT_BANNER: (clientName: string) => ({
    title: `Vista Cliente – ${clientName}`,
    description: `Stai visualizzando il calendario come ${clientName}. Tutte le restrizioni specifiche del cliente sono applicate.`,
  }),
} as const;
