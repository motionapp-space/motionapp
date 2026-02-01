
# Piano: Rimozione Email Conferma da Accept-Invite

## Panoramica
Rimuovere l'invio dell'email di conferma dopo l'accettazione dell'invito cliente, mantenendo `client_invite` esclusivamente per l'invito iniziale.

---

## Modifiche

### File: `supabase/functions/accept-invite/index.ts`

**Azione**: Rimuovere il blocco email (righe 258-276)

Codice da rimuovere:
```typescript
// Queue confirmation email via Email Outbox Pattern
const appUrl = Deno.env.get('APP_URL') || 'https://qadgzwsmiadxwwvsrauz.lovable.app';

try {
  await queueEmail(supabaseAdmin, {
    type: 'client_invite',
    toEmail: invite.email,
    recipientUserId: authUserId,
    senderUserId: null,
    templateData: {
      client_first_name: client.first_name,
      is_activation_confirmation: true,
      login_url: `${appUrl}/client/auth`,
    },
  });
  console.log(`Confirmation email queued for: ${invite.email}`);
} catch (emailError) {
  console.warn('Failed to queue confirmation email (non-fatal):', emailError);
}
```

**Azione**: Rimuovere l'import inutilizzato (riga 3)
```typescript
// Rimuovere questa riga:
import { queueEmail } from "../_shared/email-outbox.ts";
```

---

## Verifiche Post-Implementazione

| Controllo | Stato |
|-----------|-------|
| `create-invite` usa campi corretti (`invite_link`, `expires_at`) | ✓ Verificato |
| Template `client_invite` richiede solo 3 campi obbligatori | ✓ Verificato |
| Nessun altro uso di `is_activation_confirmation` | ✓ Verificato |

---

## Risultato Atteso

- Nessuna email inviata dopo `accept-invite`
- Email `client_invite` usata SOLO da `create-invite`
- Flusso di signup/login invariato
- Architettura email semplificata

---

## Sezione Tecnica

### Flusso Attuale (da modificare)
```text
create-invite → queueEmail(client_invite) → email worker → email inviata
accept-invite → queueEmail(client_invite) → ERRORE (campi mancanti)
```

### Flusso Dopo Modifica
```text
create-invite → queueEmail(client_invite) → email worker → email inviata
accept-invite → (nessuna email) → account creato → redirect login
```

### Righe da modificare
- **Riga 3**: Rimuovere import `queueEmail`
- **Righe 258-276**: Rimuovere intero blocco try/catch per email

### Dipendenze
Nessuna modifica richiesta ad altri file. Il template `client-invite.tsx` rimane invariato.
