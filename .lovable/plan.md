# ✅ COMPLETATO: Allineare la logica di eliminazione

## Modifiche implementate

- **Pagine**: `ClientDetail.tsx` e `ClientPlanEditor.tsx` ora usano `useDeletePlan` (FSM)
- **API**: `getClientPlansWithActive` filtra via `client_plan_assignments.status != 'DELETED'`
- **Workouts API**: Rimosso filtro `.is("deleted_at", null)` ridondante
- **Onboarding**: Query usa `client_plan_assignments` invece di `client_plans.deleted_at`
- **Cleanup**: Eliminato `useDeletePlanPermanent.ts`
- **Invalidation**: Aggiunto `queryClient.invalidateQueries` per `clientPlans` e `client-onboarding-plans`

## Source of truth

`client_plan_assignments.status = 'DELETED'` è ora l'unica fonte di verità per i piani eliminati.

