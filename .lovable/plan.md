

# Miglioramento UI: Reinvio Invito nel Profilo Cliente

## Obiettivo

Semplificare il feedback dopo il reinvio invito:
- Rimuovere il toast (ridondante)
- Migliorare il banner verde con info sull'email in coda
- **Non mostrare il link** - solo bottone per copiarlo

---

## File da modificare

| File | Modifica |
|------|----------|
| `src/features/clients/components/ClientInviteSection.tsx` | Rimuovere toast e migliorare banner senza mostrare link |

---

## Dettaglio tecnico

### 1. Rimuovere il toast (righe 79-81)

```tsx
// DA:
if (result.success && result.inviteLink) {
  setGeneratedLink(result.inviteLink);
  toast.success("Invito generato!", {
    description: `Email inviata a ${result.email}`
  });
  refetch();
}

// A:
if (result.success && result.inviteLink) {
  setGeneratedLink(result.inviteLink);
  refetch();
}
```

### 2. Migliorare il banner senza mostrare il link (righe 130-155)

```tsx
// A:
if (generatedLink) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-green-900">{toSentenceCase("Nuovo invito generato")}</p>
          <p className="text-sm text-green-700 mt-1">
            Un'email con il link di attivazione verrà inviata a breve.
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleCopyLink(generatedLink)}
        className="w-full"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copia link
      </Button>
      <p className="text-xs text-muted-foreground">
        Puoi anche condividere manualmente il link con il cliente.
      </p>
    </div>
  );
}
```

---

## Risultato visivo

```
┌─────────────────────────────────────┐
│ ✓ Nuovo invito generato             │
│   Un'email con il link di           │
│   attivazione verrà inviata a breve.│
└─────────────────────────────────────┘
│         [Copia link]                │
│ Puoi anche condividere manualmente  │
│ il link con il cliente.             │
```

