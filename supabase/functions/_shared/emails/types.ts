import type { EmailType } from "../email-outbox.ts";

// ============ Template Recipient ============

/** Ruolo del destinatario del template (diverso da actor_role) */
export type TemplateRecipient = 'coach' | 'client';

/** Chiave univoca per identificare un template */
export type TemplateKey = `${EmailType}:${TemplateRecipient}`;

// ============ Template Data Types ============

/** Dati per invito cliente */
export interface ClientInviteTemplateData {
  client_first_name: string;
  client_last_name?: string;
  invite_link: string;
  expires_at: string;
}

/** Dati base per email appuntamento */
export interface AppointmentBaseTemplateData {
  appointment_date: string;
  appointment_end: string;
  appointment_title?: string;
  coach_name: string;
  client_name: string;
  actor_role: 'coach' | 'client';
}

/** Dati per richiesta creata */
export interface AppointmentRequestCreatedTemplateData extends AppointmentBaseTemplateData {
  notes?: string;
}

/** Dati per appuntamento accettato */
export interface AppointmentAcceptedTemplateData extends AppointmentBaseTemplateData {}

/** Dati per controproposta */
export interface AppointmentCounterProposedTemplateData extends AppointmentBaseTemplateData {
  original_date: string;
  original_end: string;
  proposed_date: string;
  proposed_end: string;
  notes?: string;
}

/** Dati per appuntamento creato dal coach */
export interface AppointmentCreatedByCoachTemplateData extends AppointmentBaseTemplateData {}

/** Dati per appuntamento cancellato */
export interface AppointmentCancelledTemplateData extends AppointmentBaseTemplateData {
  cancelled_by: 'coach' | 'client';
}

// ============ Template Contract ============

/** Contratto che ogni template deve implementare */
export interface EmailTemplate<T = Record<string, unknown>> {
  /** Componente React per renderizzare HTML */
  component: (props: T) => JSX.Element;
  /** Funzione per generare subject */
  subject: (data: T) => string;
  /** Campi obbligatori per validazione */
  requiredFields: (keyof T)[];
}

// ============ Rendered Output ============

/** Output del rendering */
export interface RenderedEmail {
  subject: string;
  html: string;
}
