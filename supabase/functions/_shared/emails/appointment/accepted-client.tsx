/** @jsxImportSource https://esm.sh/react@18.3.1 */
import React from 'https://esm.sh/react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentAcceptedTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per appuntamento approvato.
 * Inviato al cliente quando il coach approva la sua richiesta.
 */
function AcceptedClientEmail(data: AppointmentAcceptedTemplateData) {
  return (
    <Layout preview={`Il tuo appuntamento con ${data.coach_name} è confermato`}>
      <Heading>Appuntamento confermato! 🎉</Heading>
      <Text>
        Ciao {data.client_name},
      </Text>
      <Text>
        Ottima notizia! {data.coach_name} ha confermato il tuo appuntamento.
      </Text>
      <InfoBox variant="highlight">
        <strong>📅 Data:</strong> {formatDateTime(data.appointment_date)}
        <br />
        <strong>🕐 Orario:</strong> {formatTimeRange(data.appointment_date, data.appointment_end)}
        {data.appointment_title && (
          <>
            <br />
            <strong>📝 Titolo:</strong> {data.appointment_title}
          </>
        )}
      </InfoBox>
      <Text>
        Ti aspettiamo! Se hai bisogno di modificare o cancellare l'appuntamento, 
        accedi a Motion.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentAcceptedTemplateData): string {
  return `Appuntamento confermato con ${data.coach_name}`;
}

export const acceptedClientTemplate: EmailTemplate<AppointmentAcceptedTemplateData> = {
  component: AcceptedClientEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'actor_role'],
};
