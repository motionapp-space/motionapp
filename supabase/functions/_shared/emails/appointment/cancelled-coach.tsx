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
 * Inviato al coach quando il cliente cancella un appuntamento.
 */
function CancelledCoachEmail(data: AppointmentCancelledTemplateData) {
  return (
    <Layout preview={`${data.client_name} ha cancellato l'appuntamento`}>
      <Heading>Appuntamento cancellato</Heading>
      <Text>
        {data.client_name} ha cancellato l'appuntamento previsto per:
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
      <Text muted>
        Lo slot è ora nuovamente disponibile nel tuo calendario.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentCancelledTemplateData): string {
  return `Appuntamento cancellato da ${data.client_name}`;
}

export const cancelledCoachTemplate: EmailTemplate<AppointmentCancelledTemplateData> = {
  component: CancelledCoachEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'cancelled_by'],
};
