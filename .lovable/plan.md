# ✅ COMPLETATO: Rimozione codice legacy `client_plans.status`

## Modifiche applicate

| File | Modifica |
|------|----------|
| `src/features/clients/types.ts` | Rimosso `PlanStatus` e `PlanStateLog` duplicato |
| `src/types/client.ts` | Rimosso `PlanStatus`, re-export da `client-plans/types` |
| `src/types/template.ts` | Campo `status` reso opzionale con deprecation warning |
| `src/features/client-plans/types.ts` | `PlanStatus` locale (non importato) |
| `src/features/client-plans/api/client-plans.api.ts` | Rimosso `status: "IN_CORSO"` dall'insert |
| `src/features/client-plans/hooks/useDuplicatePlan.ts` | Rimosso `status: "IN_CORSO"` dall'insert |
| `src/features/clients/hooks/useClientOnboardingState.ts` | Query usa `.is('deleted_at', null)` |
| `src/stores/useClientStore.ts` | Rimosso import `PlanStatus` inutilizzato |

## Source of truth

`client_plan_assignments.status` è l'unica fonte di verità per lo stato del piano:
- `ACTIVE` = piano in uso
- `COMPLETED` / `DELETED` / `PAUSED` = altri piani

`client_plans.status` è frozen al valore di default DB e non viene più scritto esplicitamente.
