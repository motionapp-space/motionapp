

# Semplificazione Dialog Post-Creazione Cliente

## Problema attuale

Il dialog `InviteLinkDialog` mostra due scenari:
- **Scenario A** (verde): "Email inviata con successo"
- **Scenario B** (arancione): "Email non inviata - condividi manualmente il link"

Questo design è obsoleto perché il sistema usa l'**Outbox Pattern**:
1. L'email viene accodata nella tabella `email_messages`
2. Il worker `email-worker` la processa in modo asincrono
3. L'invio avviene sempre (salvo errori del worker), quindi non ha senso mostrare lo stato "inviata/non inviata" al momento della creazione

## Soluzione

Semplificare il dialog mostrando **un unico scenario positivo**: "Cliente creato con successo - riceverà un'email con le istruzioni".

---

## File da modificare

| File | Modifica |
|------|----------|
| `src/features/clients/components/InviteLinkDialog.tsx` | Rimuovere branching emailSent, unico scenario positivo |
| `src/features/clients/hooks/useCreateClient.ts` | Rimuovere mapping emailSent/emailError |
| `src/features/clients/types.ts` | Rimuovere campi emailSent/emailError dal tipo |
| `supabase/functions/create-invite/index.ts` | Rimuovere campo emailQueued dalla risposta |

---

## Modifiche dettagliate

### 1. `src/features/clients/components/InviteLinkDialog.tsx`

**Semplificare le props:**
```tsx
interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteLink: string;
  clientName: string;
  email: string;
  expiresAt: string;
  onClose: () => void;
}
// Rimuovere: emailSent, emailError
```

**Unico scenario (sempre positivo):**
```tsx
export function InviteLinkDialog({
  open,
  onOpenChange,
  inviteLink,
  clientName,
  email,
  expiresAt,
  onClose,
}: InviteLinkDialogProps) {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            Cliente creato con successo!
          </DialogTitle>
          <DialogDescription className="pt-2">
            Abbiamo inviato un'email a <strong>{email}</strong> con le 
            istruzioni per completare la registrazione.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Il link scade il <strong>{formattedExpiry}</strong>. 
                Puoi reinviarlo in qualsiasi momento dalla scheda cliente.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose} className="w-full">
            Vai alla scheda cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Rimuovere:**
- Import `AlertTriangle`, `Copy`, `Input`
- useState per `copied`
- Funzione `handleCopy`
- Tutto lo Scenario B (righe 100-176)

---

### 2. `src/features/clients/hooks/useCreateClient.ts`

**Rimuovere mapping emailSent/emailError (righe 20-28):**

```tsx
// DA:
if (inviteResult.success && inviteResult.inviteLink) {
  invite = {
    inviteLink: inviteResult.inviteLink,
    expiresAt: inviteResult.expiresAt!,
    email: inviteResult.email!,
    clientName: inviteResult.clientName!,
    emailSent: inviteResult.emailSent ?? false,
    emailError: inviteResult.emailError,
  };
}

// A:
if (inviteResult.success && inviteResult.inviteLink) {
  invite = {
    inviteLink: inviteResult.inviteLink,
    expiresAt: inviteResult.expiresAt!,
    email: inviteResult.email!,
    clientName: inviteResult.clientName!,
  };
}
```

---

### 3. `src/features/clients/types.ts`

Verificare e aggiornare il tipo `CreateClientResult["invite"]`:

```tsx
// Rimuovere:
emailSent: boolean;
emailError?: string;
```

---

### 4. `supabase/functions/create-invite/index.ts`

**Rimuovere logica emailQueued dalla risposta (righe 147-176):**

```tsx
// DA:
let emailQueued = false;
try {
  await queueEmail(...);
  emailQueued = true;
} catch (emailError) {
  console.warn('Failed to queue invite email (non-fatal):', emailError);
}

return new Response(
  JSON.stringify({
    success: true,
    inviteLink,
    expiresAt: invite.expires_at,
    clientName: `${client.first_name} ${client.last_name}`,
    email: client.email,
    emailQueued,  // <-- rimuovere
  }),
  ...
);

// A:
try {
  await queueEmail(...);
  console.log(`Email queued for client invite: ${client.email}`);
} catch (emailError) {
  console.warn('Failed to queue invite email (non-fatal):', emailError);
  // Non blocchiamo - l'email può essere re-inviata dalla scheda cliente
}

return new Response(
  JSON.stringify({
    success: true,
    inviteLink,
    expiresAt: invite.expires_at,
    clientName: `${client.first_name} ${client.last_name}`,
    email: client.email,
  }),
  ...
);
```

---

### 5. Aggiornare chiamate al dialog in `src/pages/Clients.tsx`

Rimuovere le props `emailSent` e `emailError` dove viene usato `InviteLinkDialog`.

---

## Riepilogo

| Elemento | Prima | Dopo |
|----------|-------|------|
| Dialog scenari | 2 (successo/fallback) | 1 (sempre successo) |
| Props emailSent | Sì | No |
| Props emailError | Sì | No |
| Campo API emailQueued | Sì | No |
| Pulsante "Copia link" nel dialog | Sì (solo fallback) | No |

## Note

- Il link di invito resta sempre disponibile nella scheda cliente
- Se l'email non viene recapitata, il coach può reinviare dalla scheda cliente
- L'esperienza utente è più semplice e positiva

