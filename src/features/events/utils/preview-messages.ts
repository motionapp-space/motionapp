/**
 * FASE 1: Preview mode messages and utilities
 * Centralized messages for calendar preview functionality
 */

export const PREVIEW_MESSAGES = {
  BLOCKED_ACTION: "Questa è una simulazione della vista cliente. Per creare un appuntamento passa alla modalità Professionista.",
  BANNER_CLIENT_PREVIEW: "Stai visualizzando il calendario come un cliente generico. Le regole di prenotazione e disponibilità sono attive.",
  BANNER_SPECIFIC_CLIENT: (clientName: string) => 
    `Stai visualizzando il calendario come vedrebbe ${clientName}. Tutte le restrizioni e regole specifiche del cliente sono applicate.`,
} as const;
