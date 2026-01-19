/**
 * Email Template Registry
 * 
 * Punto centrale per risolvere i template email.
 * Ogni template è mappato per tipo email e destinatario.
 */

import type { EmailType } from "../email-outbox.ts";
import type { EmailTemplate, TemplateRecipient, TemplateKey, RenderedEmail } from "./types.ts";

// Import tutti i template
import { clientInviteTemplate } from "./client-invite.tsx";
import { requestCreatedCoachTemplate } from "./appointment/request-created-coach.tsx";
import { acceptedCoachTemplate } from "./appointment/accepted-coach.tsx";
import { acceptedClientTemplate } from "./appointment/accepted-client.tsx";
import { counterProposedClientTemplate } from "./appointment/counter-proposed-client.tsx";
import { cancelledCoachTemplate } from "./appointment/cancelled-coach.tsx";
import { cancelledClientTemplate } from "./appointment/cancelled-client.tsx";

/**
 * Registry dei template.
 * Chiave: `${emailType}:${recipient}`
 */
const TEMPLATE_REGISTRY: Record<string, EmailTemplate<any>> = {
  // Client invite (sempre verso client)
  'client_invite:client': clientInviteTemplate,
  
  // Richiesta creata (client → coach riceve notifica)
  'appointment_request_created:coach': requestCreatedCoachTemplate,
  
  // Appuntamento accettato
  // - Coach approva richiesta → client riceve conferma
  // - Client accetta controproposta → coach riceve conferma
  'appointment_accepted:coach': acceptedCoachTemplate,
  'appointment_accepted:client': acceptedClientTemplate,
  
  // Counter proposal (coach propone → client riceve)
  'appointment_counter_proposed:client': counterProposedClientTemplate,
  
  // Cancellazione
  // - Client cancella → coach riceve notifica
  // - Coach cancella → client riceve notifica
  'appointment_cancelled:coach': cancelledCoachTemplate,
  'appointment_cancelled:client': cancelledClientTemplate,
};

/**
 * Risolve il template corretto dato emailType e recipient.
 * Lancia errore se template non trovato (NO fallback silenziosi).
 * 
 * @throws Error se il template non esiste
 */
export function resolveEmailTemplate(
  type: EmailType,
  recipient: TemplateRecipient
): EmailTemplate<any> {
  const key: TemplateKey = `${type}:${recipient}`;
  const template = TEMPLATE_REGISTRY[key];
  
  if (!template) {
    throw new Error(`Template not found for key: ${key}. Available: ${Object.keys(TEMPLATE_REGISTRY).join(', ')}`);
  }
  
  return template;
}

/**
 * Determina il recipient dal templateData.
 * 
 * Logica:
 * - Per client_invite: sempre 'client'
 * - Per email di appuntamento: destinatario è l'opposto di chi ha agito
 *   - actor_role === 'client' → recipient è 'coach'
 *   - actor_role === 'coach' → recipient è 'client'
 * 
 * @throws Error se actor_role manca per tipi che lo richiedono
 */
export function determineRecipient(
  type: EmailType,
  templateData: Record<string, unknown>
): TemplateRecipient {
  // Client invite è sempre verso il client
  if (type === 'client_invite') {
    return 'client';
  }
  
  const actorRole = templateData.actor_role as string | undefined;
  
  if (!actorRole) {
    throw new Error(`actor_role is required in templateData for type: ${type}`);
  }
  
  // Recipient è l'opposto di chi ha agito
  return actorRole === 'client' ? 'coach' : 'client';
}

/**
 * Lista tutti i template disponibili (per debug/test).
 */
export function listAvailableTemplates(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

// Re-export types
export type { EmailTemplate, TemplateRecipient, TemplateKey, RenderedEmail };
export * from "./types.ts";
