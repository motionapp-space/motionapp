
# Piano: Rimozione File Deprecati (Test e Utility Legacy)

## Riepilogo

Elimino tutti i file deprecati identificati nel refactor relazione-centrico. Questi file referenziano ancora il vecchio modello a 5 stati (`ATTIVO`, `POTENZIALE`, `INATTIVO`, `ARCHIVIATO`, `INVITATO`) che non esiste più dopo la migrazione.

---

## File da Eliminare

| File | Motivo |
|------|--------|
| `src/features/clients/__tests__/client-fsm.test.ts` | Test con assert su `clients.status` (colonna eliminata) |
| `src/features/clients/__tests__/integration.md` | Documentazione obsoleta (test manuali vecchio modello) |
| `src/features/clients/__tests__/IMPLEMENTATION_SUMMARY.md` | Documentazione obsoleta (riferimenti a stati legacy) |
| `src/features/clients/utils/status-utils.ts` | Helper per status a 5 stati (non più utilizzato) |
| `src/pages/ClientsOld.tsx` | Pagina legacy che importa `status-utils.ts` |

---

## Verifica Dipendenze

Ho verificato che:
- `status-utils.ts` è importato solo da `ClientsOld.tsx` (pagina legacy da eliminare)
- La pagina principale `src/pages/Clients.tsx` NON usa questi file
- `filters.ts` è già stato refactorizzato per non usare `ClientStatus`
- Nessun altro file dipende da questi moduli

---

## Azioni

1. **Eliminare 5 file** deprecati
2. **Aggiornare `.lovable/plan.md`** rimuovendo la sezione "File Deprecati" (ora completata)

---

## Note Tecniche

- I test rimanenti in `__tests__/` (`filters-*.test.ts`, `README.md`) sono ancora validi
- L'ENUM `client_status` nel DB rimane per `client_state_logs` (storico) — non toccato
