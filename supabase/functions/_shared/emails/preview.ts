/**
 * Email Preview
 * 
 * Funzioni per testare e visualizzare email senza inviarle.
 */

import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { renderEmail } from "./renderer.ts";
import type { RenderedEmail } from "./types.ts";

/** Output della preview con metadati */
export interface PreviewResult extends RenderedEmail {
  id: string;
  to_email: string;
  type: string;
  template_data: Record<string, unknown>;
}

/**
 * Preview di un'email esistente dal database.
 * NON invia email.
 */
export async function previewEmail(
  emailMessageId: string,
  supabaseAdmin: SupabaseClient
): Promise<PreviewResult> {
  console.log(`[previewEmail] Loading email: ${emailMessageId}`);
  
  const { data: emailMessage, error } = await supabaseAdmin
    .from('email_messages')
    .select('id, type, to_email, template_data')
    .eq('id', emailMessageId)
    .single();
  
  if (error || !emailMessage) {
    throw new Error(`Email message not found: ${emailMessageId}. Error: ${error?.message}`);
  }
  
  const msg = emailMessage as { id: string; type: string; to_email: string; template_data: Record<string, unknown> };
  
  console.log(`[previewEmail] Found email type: ${msg.type}, to: ${msg.to_email}`);
  
  const rendered = await renderEmail({
    type: msg.type,
    template_data: msg.template_data,
  });
  
  return {
    id: msg.id,
    to_email: msg.to_email,
    type: msg.type,
    template_data: msg.template_data,
    ...rendered,
  };
}

/**
 * Preview con dati mock per test senza database.
 */
export async function previewEmailMock(
  type: string,
  templateData: Record<string, unknown>
): Promise<RenderedEmail> {
  return renderEmail({ type, template_data: templateData });
}

/**
 * Genera dati mock per test di ogni tipo di email.
 */
export function getMockTemplateData(type: string): Record<string, unknown> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowLater = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const mocks: Record<string, Record<string, unknown>> = {
    client_invite: {
      client_first_name: 'Marco',
      client_last_name: 'Rossi',
      invite_link: 'https://studio-ai.app/invite/abc123',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    appointment_request_created: {
      appointment_date: tomorrow.toISOString(),
      appointment_end: tomorrowLater.toISOString(),
      appointment_title: 'Sessione di allenamento',
      coach_name: 'Coach Luigi',
      client_name: 'Marco Rossi',
      actor_role: 'client',
      notes: 'Vorrei concentrarmi sulla parte cardio.',
    },
    appointment_accepted: {
      appointment_date: tomorrow.toISOString(),
      appointment_end: tomorrowLater.toISOString(),
      appointment_title: 'Sessione di allenamento',
      coach_name: 'Coach Luigi',
      client_name: 'Marco Rossi',
      actor_role: 'coach',
    },
    appointment_counter_proposed: {
      appointment_date: tomorrowLater.toISOString(),
      appointment_end: new Date(tomorrowLater.getTime() + 60 * 60 * 1000).toISOString(),
      coach_name: 'Coach Luigi',
      client_name: 'Marco Rossi',
      actor_role: 'coach',
      original_date: tomorrow.toISOString(),
      original_end: tomorrowLater.toISOString(),
      proposed_date: tomorrowLater.toISOString(),
      proposed_end: new Date(tomorrowLater.getTime() + 60 * 60 * 1000).toISOString(),
    },
    appointment_cancelled: {
      appointment_date: tomorrow.toISOString(),
      appointment_end: tomorrowLater.toISOString(),
      coach_name: 'Coach Luigi',
      client_name: 'Marco Rossi',
      actor_role: 'client',
      cancelled_by: 'client',
    },
  };

  return mocks[type] || {};
}
