/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { Layout } from '../shared/layout.tsx';
import { Heading } from '../shared/heading.tsx';
import { Text } from '../shared/text.tsx';
import { InfoBox } from '../shared/info-box.tsx';
import type { AppointmentRequestCreatedTemplateData, EmailTemplate } from '../types.ts';
import { formatDateTime, formatTimeRange } from '../helpers.ts';

/**
 * Template email per richiesta appuntamento ricevuta.
 * Inviato al coach quando un cliente richiede un appuntamento.
 */
function RequestCreatedCoachEmail(data: AppointmentRequestCreatedTemplateData) {
  return (
    <Layout preview={`Nuova richiesta di appuntamento da ${data.client_name}`}>
      <Heading>Nuova richiesta di appuntamento</Heading>
      <Text>
        {data.client_name} ha richiesto un appuntamento.
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
      {data.notes && (
        <>
          <Text>
            <strong>Note del cliente:</strong>
          </Text>
          <Text muted>{data.notes}</Text>
        </>
      )}
      <Text>
        Accedi a Motion per approvare, modificare o rifiutare la richiesta.
      </Text>
    </Layout>
  );
}

function subject(data: AppointmentRequestCreatedTemplateData): string {
  return `Nuova richiesta di appuntamento da ${data.client_name}`;
}

export const requestCreatedCoachTemplate: EmailTemplate<AppointmentRequestCreatedTemplateData> = {
  component: RequestCreatedCoachEmail,
  subject,
  requiredFields: ['appointment_date', 'appointment_end', 'coach_name', 'client_name', 'actor_role'],
};
