/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentAcceptedTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per controproposta accettata.
 * Inviato al coach quando il cliente accetta la controproposta.
 */
function AcceptedCoachEmail(data: AppointmentAcceptedTemplateData) {
  return (
    <Layout preview={`${data.client_name} ha accettato la controproposta`}>
      <Heading>Controproposta accettata! ✅</Heading>
      <Text>
        {data.client_name} ha accettato la tua controproposta.
      </Text>
      <Text>
        L'appuntamento è ora confermato:
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
    </Layout>
  );
}

function subject(data: AppointmentAcceptedTemplateData): string {
  return `${data.client_name} ha accettato la controproposta`;
}

export const acceptedCoachTemplate: EmailTemplate<AppointmentAcceptedTemplateData> = {
  component: AcceptedCoachEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'actor_role'],
};
