/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentCancelledTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per appuntamento cancellato.
 * Inviato al cliente quando il coach cancella un appuntamento.
 */
function CancelledClientEmail(data: AppointmentCancelledTemplateData) {
  return (
    <Layout preview={`Il tuo appuntamento è stato cancellato`}>
      <Heading>Appuntamento cancellato</Heading>
      <Text>
        Ciao {data.client_name},
      </Text>
      <Text>
        {data.coach_name} ha cancellato l'appuntamento previsto per:
      </Text>
      <InfoBox variant="warning">
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
        Contatta il tuo coach per riprogrammare l'appuntamento, 
        oppure prenota un nuovo slot su Motion.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentCancelledTemplateData): string {
  return `Il tuo appuntamento con ${data.coach_name} è stato cancellato`;
}

export const cancelledClientTemplate: EmailTemplate<AppointmentCancelledTemplateData> = {
  component: CancelledClientEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'cancelled_by'],
};
