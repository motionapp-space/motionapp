# Semplificazione Dialog Post-Creazione Cliente

**STATO: ✅ COMPLETATO**

## Riepilogo modifiche

Il dialog `InviteLinkDialog` ora mostra un unico scenario positivo, senza branching basato sullo stato dell'email.

### File modificati

| File | Stato |
|------|-------|
| `src/features/clients/components/InviteLinkDialog.tsx` | ✅ Semplificato |
| `src/features/clients/hooks/useCreateClient.ts` | ✅ Rimossi campi email |
| `src/features/clients/types.ts` | ✅ Rimossi emailSent/emailError |
| `src/features/clients/api/invites.api.ts` | ✅ Aggiornato tipo |
| `src/features/clients/components/ClientInviteSection.tsx` | ✅ Rimosso branching email |
| `supabase/functions/create-invite/index.ts` | ✅ Rimosso emailQueued |
| `src/pages/Clients.tsx` | ✅ Aggiornate props dialog |

## Note

- Il link di invito resta sempre disponibile nella scheda cliente
- Se l'email non viene recapitata, il coach può reinviare dalla scheda cliente
- L'esperienza utente è più semplice e positiva
