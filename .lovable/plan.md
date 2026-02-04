# Refactor Clienti: Modello Relazione-Centrico

## ✅ Completato

Il refactor del modello clienti è stato completato. Lo stato del cliente è ora gestito esclusivamente dalla relazione `coach_clients`.

### Modello Dati Finale

| Tabella | Scopo |
|---------|-------|
| `clients` | Solo profilo/identità (no status) |
| `coach_clients.status` | Fonte unica di verità: `active`, `blocked`, `archived` |
| `client_invites.status` | Ciclo di vita inviti (indipendente) |

### File Rimossi (Legacy)

- `src/features/clients/__tests__/client-fsm.test.ts`
- `src/features/clients/__tests__/integration.md`
- `src/features/clients/__tests__/IMPLEMENTATION_SUMMARY.md`
- `src/features/clients/utils/status-utils.ts`
- `src/pages/ClientsOld.tsx`

### Note

- L'ENUM `client_status` nel DB rimane per `client_state_logs` (storico)
- I test in `__tests__/` (`filters-*.test.ts`, `README.md`) sono ancora validi
