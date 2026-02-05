/** @jsxImportSource npm:react@18.3.1 */
import React from 'npm:react@18.3.1';
import { Layout } from './shared/layout.tsx';
import { Heading } from './shared/heading.tsx';
import { Text } from './shared/text.tsx';
import { Button } from './shared/button.tsx';
import type { ClientInviteTemplateData, EmailTemplate } from './types.ts';

/**
 * Template email per invito cliente.
 * Inviato quando un coach invita un nuovo cliente.
 */
function ClientInviteEmail(data: ClientInviteTemplateData) {
  const fullName = data.client_last_name 
    ? `${data.client_first_name} ${data.client_last_name}`
    : data.client_first_name;

  return (
    <Layout preview={`Sei stato invitato a Motion`}>
      <Heading>Benvenuto su Motion</Heading>
      <Text>
        Ciao {data.client_first_name},
      </Text>
      <Text>
        Sei stato invitato a unirti a Motion per gestire i tuoi 
        allenamenti e appuntamenti con il tuo coach.
      </Text>
      <Text>
        Clicca il pulsante qui sotto per accettare l'invito e creare 
        il tuo account.
      </Text>
      <Button href={data.invite_link}>
        Accetta l'invito
      </Button>
      <Text muted small>
        Questo link scadrà tra 7 giorni. Se non hai richiesto questo 
        invito, puoi ignorare questa email.
      </Text>
    </Layout>
  );
}

function subject(data: ClientInviteTemplateData): string {
  return `${data.client_first_name}, sei stato invitato a Motion`;
}

export const clientInviteTemplate: EmailTemplate<ClientInviteTemplateData> = {
  component: ClientInviteEmail,
  subject,
  requiredFields: ['client_first_name', 'invite_link', 'expires_at'],
};
