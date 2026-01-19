/**
 * Email Renderer
 * 
 * Renderizza template email in HTML.
 * NON invia email - solo rendering puro.
 */

import React from 'https://esm.sh/react@18.3.1';
import { render } from 'https://esm.sh/@react-email/components@0.0.22';
import type { EmailType } from "../email-outbox.ts";
import { resolveEmailTemplate, determineRecipient } from "./index.ts";
import type { RenderedEmail } from "./types.ts";

/**
 * Valida che tutti i campi richiesti siano presenti nel templateData.
 * 
 * @throws Error se mancano campi obbligatori
 */
function validateTemplateData(
  requiredFields: string[],
  templateData: Record<string, unknown>,
  templateKey: string
): void {
  const missing = requiredFields.filter(field => {
    const value = templateData[field];
    return value === undefined || value === null;
  });
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields for template "${templateKey}": ${missing.join(', ')}. ` +
      `Received: ${JSON.stringify(templateData)}`
    );
  }
}

/**
 * Renderizza un record email_messages in HTML + subject.
 * 
 * Flusso:
 * 1. Determina recipient da templateData
 * 2. Risolve template dal registry
 * 3. Valida campi obbligatori
 * 4. Genera subject
 * 5. Renderizza HTML
 * 
 * NON invia email - solo rendering.
 * 
 * @param emailMessage - Record da email_messages table (type + template_data)
 * @returns subject + html
 * @throws Error se template non trovato o dati mancanti
 */
export async function renderEmail(emailMessage: {
  type: string;
  template_data: Record<string, unknown>;
}): Promise<RenderedEmail> {
  const type = emailMessage.type as EmailType;
  const templateData = emailMessage.template_data;
  
  // 1. Determina recipient
  const recipient = determineRecipient(type, templateData);
  const templateKey = `${type}:${recipient}`;
  
  console.log(`[renderEmail] Rendering template: ${templateKey}`);
  
  // 2. Risolvi template
  const template = resolveEmailTemplate(type, recipient);
  
  // 3. Valida dati richiesti
  validateTemplateData(
    template.requiredFields as string[], 
    templateData,
    templateKey
  );
  
  // 4. Genera subject
  const subject = template.subject(templateData);
  
  // 5. Renderizza HTML
  const html = render(
    React.createElement(template.component, templateData)
  );
  
  console.log(`[renderEmail] Successfully rendered: ${templateKey}, subject: "${subject}"`);
  
  return { subject, html };
}

/**
 * Verifica se un template esiste per il tipo e recipient specificati.
 * Utile per validazione preventiva.
 */
export function canRenderEmail(
  type: string,
  templateData: Record<string, unknown>
): boolean {
  try {
    const recipient = determineRecipient(type as EmailType, templateData);
    resolveEmailTemplate(type as EmailType, recipient);
    return true;
  } catch {
    return false;
  }
}
