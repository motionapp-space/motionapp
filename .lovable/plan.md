

## Pulizia codice morto: lezioni singole e integrazione pacchetti legacy

### Contesto

Il sistema e' migrato alla RPC `create_event_with_economics_internal` che crea atomicamente evento + ordine. Un trigger DB `prevent_new_technical_packages` blocca la creazione di pacchetti con `is_single_technical = true`. Molto codice frontend legacy rimane pero' nel codebase.

### File da ELIMINARE completamente

| File | Motivo |
|------|--------|
| `src/features/packages/api/single-lesson.api.ts` | Entrambe le funzioni (`createSingleLessonPackage`, `createSingleLessonOrder`) non sono importate da nessun componente attivo |
| `src/features/packages/hooks/useCreateSingleLesson.ts` | Entrambi gli hook (`useCreateSingleLesson`, `useCreateSingleLessonOrder`) non sono importati da nessun componente |
| `src/features/packages/hooks/useEventPackageIntegration.ts` | I 3 hook (`useConfirmEventWithPackage`, `useCompleteEventWithPackage`, `useCancelEventWithPackage`) non sono importati da nessun componente |
| `src/features/packages/components/SingleLessonDialog.tsx` | Componente mai importato da nessun file |

### File da MODIFICARE

**`src/features/events/components/EventEditorModal.tsx`**

- Rimuovere import di `handleEventConfirm` (L16) -- usato solo nel path `package` che passa `formData.clientId` (client ID) anziche' `coachClientId`, probabilmente non funzionante; da verificare se il path package e' ancora attivo o gestito dalla RPC
- Rimuovere import di `createLedgerEntry` (L17) -- usato solo nei blocchi single lesson
- Rimuovere import di `createPackage` (L18) -- usato solo nei blocchi single lesson (bloccato dal trigger DB)
- Rimuovere blocco L571-616: creazione pacchetto tecnico per lezione singola ricorrente (bloccato dal trigger)
- Rimuovere blocco L683-720: creazione pacchetto tecnico per lezione singola (bloccato dal trigger)

**Nota importante su L726-741**: il path `lessonType === "package"` usa `handleEventConfirm` dalla `calendar-integration.api`. Questo path potrebbe essere ancora attivo per eventi con pacchetto. Serve verificare se la creazione evento via `createEvent` (insert diretto su tabella `events`) e' ancora il flusso usato o se tutto passa dalla RPC. Se il flusso diretto e' ancora usato, `handleEventConfirm` resta necessario e il suo import va mantenuto (ma spostato come import diretto solo per quel path).

**`src/features/packages/api/calendar-integration.api.ts`**

- Rimuovere il commento che menziona `SingleLessonDialog` (L15-16, L29)
- Le funzioni `handleEventConfirm`, `handleEventComplete`, `handleEventCancel`, `findPackageForEvent` restano perche' usate da `useCancelEvent.ts` e potenzialmente dal path package dell'EventEditorModal

**`src/features/packages/components/PackageCard.tsx`**

- Rimuovere il blocco condizionale `is_single_technical` (L112+) che mostra un badge per pacchetti tecnici -- non possono piu' essere creati

### File NON toccati (nota)

- `src/features/packages/types.ts`: il campo `is_single_technical` resta perche' riflette la colonna DB ancora esistente (potrebbe servire per record storici)
- `src/integrations/supabase/types.ts`: generato automaticamente, non si tocca
- `src/features/packages/api/packages.api.ts`: il filtro `is_single_technical` (L226-228) e il campo nel `createPackage` (L129) restano perche' il tipo Package lo richiede
- `src/features/packages/__tests__/package-integration.test.ts`: i valori `is_single_technical: false` nei mock sono corretti e restano

### Sequenza di implementazione

1. Eliminare i 4 file morti
2. Pulire i blocchi morti in EventEditorModal (single lesson technical package creation)
3. Pulire i commenti obsoleti in calendar-integration.api
4. Rimuovere badge `is_single_technical` da PackageCard
5. Rimuovere import inutilizzati risultanti dalle modifiche

