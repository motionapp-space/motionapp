/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentCreatedByCoachTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per appuntamento creato dal coach.
 * Inviato al cliente quando il coach crea un nuovo appuntamento direttamente dal calendario.
 */
function CreatedByCoachClientEmail(data: AppointmentCreatedByCoachTemplateData) {
  return (
    <Layout preview={`${data.coach_name} ha fissato un nuovo appuntamento per te`}>
      <Heading>Nuovo appuntamento programmato 📅</Heading>
      <Text>
        Ciao {data.client_name},
      </Text>
      <Text>
        {data.coach_name} ha fissato un appuntamento per te.
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
        Se hai bisogno di modificare o cancellare l'appuntamento,
        accedi a Motion.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentCreatedByCoachTemplateData): string {
  return `Nuovo appuntamento con ${data.coach_name}`;
}

export const createdByCoachClientTemplate: EmailTemplate<AppointmentCreatedByCoachTemplateData> = {
  component: CreatedByCoachClientEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'actor_role'],
};
