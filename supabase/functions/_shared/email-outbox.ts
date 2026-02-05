import { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Email types supported by the outbox system.
 * Each type maps to a specific email template.
 */
export type EmailType = 
  | 'client_invite'
  | 'appointment_request_created'
  | 'appointment_accepted'
  | 'appointment_counter_proposed'
  | 'appointment_cancelled';

/**
 * Parameters for queuing an email.
 */
export interface QueueEmailParams {
  /** The email template type */
  type: EmailType;
  /** Recipient email address */
  toEmail: string;
  /** User ID of the recipient (null if not yet registered) */
  recipientUserId?: string | null;
  /** User ID of the actor who caused this email (null if system) */
  senderUserId?: string | null;
  /** Snapshot of all data needed for the email template */
  templateData: Record<string, unknown>;
  /** When to send the email (defaults to now) */
  scheduledAt?: Date;
}

/**
 * Queue an email for later delivery by the email worker.
 * 
 * This function ONLY inserts a record into the email_messages table.
 * It does NOT send emails - that is handled by an external worker.
 * 
 * @param supabaseAdmin - Supabase client with service role privileges
 * @param params - Email parameters
 * @returns The ID of the queued email message
 */
export async function queueEmail(
  supabaseAdmin: SupabaseClient,
  params: QueueEmailParams
): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from('email_messages')
    .insert({
      type: params.type,
      to_email: params.toEmail,
      recipient_user_id: params.recipientUserId ?? null,
      sender_user_id: params.senderUserId ?? null,
      template_data: params.templateData,
      scheduled_at: params.scheduledAt?.toISOString() ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[email-outbox] Failed to queue email:', error);
    throw new Error(`Failed to queue email: ${error.message}`);
  }
  
  console.log(`[email-outbox] Email queued: type=${params.type}, to=${params.toEmail}, id=${data.id}`);
  return { id: data.id };
}
