
# Fix: InviteLinkDialog non visibile in tutti gli stati di onboarding

## Problema identificato

Il componente `Clients.tsx` ha **4 diversi blocchi `return`** basati sullo stato di onboarding:

| Riga | Stato | Ha InviteLinkDialog? |
|------|-------|---------------------|
| 298 | Loading | No (OK - non serve) |
| 307 | ZERO_CLIENTS | **NO** |
| 527 | FIRST_CLIENT_NO_CONTENT | **NO** |
| 1108 | ACTIVE_USER | Si |

Il coach `lex@gmail.com` è nello stato `FIRST_CLIENT_NO_CONTENT` (8 clienti, 0 piani, 0 appuntamenti), quindi quando crea un cliente:
1. L'`onSuccess` imposta `inviteDialogData`
2. Il componente fa return alla riga 527
3. Il dialog (riga 1706) non viene mai renderizzato perché fa parte del return alla riga 1108

## Soluzione

Aggiungere `InviteLinkDialog` anche ai blocchi return degli stati `ZERO_CLIENTS` e `FIRST_CLIENT_NO_CONTENT`.

---

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/Clients.tsx` | Aggiungere InviteLinkDialog in ZERO_CLIENTS (prima di riga 522) |
| `src/pages/Clients.tsx` | Aggiungere InviteLinkDialog in FIRST_CLIENT_NO_CONTENT (prima di riga 1104) |

---

## Dettaglio tecnico

### 1. Stato ZERO_CLIENTS (riga ~520, prima del closing tag)

Aggiungere prima della chiusura `</div>` e `);`:

```tsx
      {/* Invite Link Dialog */}
      {inviteDialogData && (
        <InviteLinkDialog
          open={!!inviteDialogData}
          onOpenChange={(open) => !open && handleCloseInviteDialog()}
          inviteLink={inviteDialogData.inviteLink}
          clientName={inviteDialogData.clientName}
          email={inviteDialogData.email}
          expiresAt={inviteDialogData.expiresAt}
          onClose={handleCloseInviteDialog}
        />
      )}
```

### 2. Stato FIRST_CLIENT_NO_CONTENT (riga ~1102, prima del closing tag)

Aggiungere lo stesso blocco:

```tsx
      {/* Invite Link Dialog */}
      {inviteDialogData && (
        <InviteLinkDialog
          open={!!inviteDialogData}
          onOpenChange={(open) => !open && handleCloseInviteDialog()}
          inviteLink={inviteDialogData.inviteLink}
          clientName={inviteDialogData.clientName}
          email={inviteDialogData.email}
          expiresAt={inviteDialogData.expiresAt}
          onClose={handleCloseInviteDialog}
        />
      )}
```

---

## Riepilogo modifiche

| Return block | Prima | Dopo |
|--------------|-------|------|
| ZERO_CLIENTS | Nessun dialog | Dialog presente |
| FIRST_CLIENT_NO_CONTENT | Nessun dialog | Dialog presente |
| ACTIVE_USER | Dialog presente | Invariato |

## Risultato atteso

Dopo questa modifica:
- Il dialog di conferma invito apparirà in **tutti gli stati di onboarding**
- Il coach verrà reindirizzato alla scheda cliente quando chiude il dialog
- L'esperienza sarà coerente indipendentemente dalla "maturità" del coach

