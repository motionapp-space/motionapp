
# Piano: Fix Navigazione dopo Creazione Cliente

## Problema Identificato

Il cliente viene creato correttamente ma la navigazione alla pagina di dettaglio non avviene. 

**Causa tecnica**: Conflitto tra due `onSuccess` handlers:
1. **Hook** (`useCreateClient.ts:38`): invalida la cache e causa re-render
2. **Componente** (`Clients.tsx:197`): gestisce la navigazione

L'invalidazione delle query può causare un re-render che interferisce con l'esecuzione della navigazione, specialmente se il componente viene smontato/rimontato durante il processo.

---

## Soluzione

Spostare la logica di navigazione **all'interno dell'hook** `useCreateClient`, restituendo una callback o usando un pattern più robusto.

### Opzione Implementata: Navigation-First

Invertire l'ordine: **navigare prima**, poi invalidare la cache.

| Passo | Azione |
|-------|--------|
| 1 | Creare il cliente (mutationFn) |
| 2 | Restituire `{ client, invite }` |
| 3 | Nel componente: navigare immediatamente |
| 4 | Invalidare la cache **dopo** la navigazione |

---

## Modifiche

### 1. `src/features/clients/hooks/useCreateClient.ts`

Modificare l'`onSuccess` dell'hook per usare `setTimeout` sull'invalidazione, garantendo che la navigazione avvenga prima:

```typescript
onSuccess: async (result) => {
  const { client } = result;
  
  // Log activity
  await logClientActivity(
    client.id,
    "CREATED",
    `Cliente creato: ${client.first_name} ${client.last_name}`
  );

  // Delay cache invalidation to allow navigation to complete first
  setTimeout(() => {
    qc.invalidateQueries({ queryKey: ["clients"] });
  }, 100);
}
```

### 2. `src/pages/Clients.tsx`

Assicurarsi che la navigazione sia **sincrona** e non dipenda dallo stato:

```typescript
createMutation.mutate(normalizedData, {
  onSuccess: (result) => {
    // Close dialog and reset form first
    setCreateDialogOpen(false);
    setFormData({ first_name: "", last_name: "", email: "", phone: "", fiscal_code: "", notes: "" });
    setValidationErrors({});
    setWithInvite(false);
    
    if (result.invite) {
      setInviteDialogData({...});
    } else {
      toast.success("Cliente creato con successo");
      // Navigate immediately - no state dependencies
      navigate(`/clients/${result.client.id}`);
    }
  },
});
```

---

## Note Tecniche

- L'uso di `setTimeout` garantisce che la navigazione venga processata prima del re-render causato dall'invalidazione
- Il pattern è comune in React Query quando navigazione e cache invalidation devono coesistere
- In alternativa si potrebbe usare `onSettled` invece di `onSuccess` per l'invalidazione
