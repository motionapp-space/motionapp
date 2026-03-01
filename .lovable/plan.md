

## Allineamento bottone "Home" nelle pagine Admin

Le pagine **Coach** e **Feedback** usano il prop `toolbar` di `SectionShell` per il bottone di ritorno (posizionato a destra del titolo). La pagina **Inviti** invece lo posiziona come elemento autonomo sotto il titolo, prima della Card.

### Modifiche

Allineare Coach e Feedback allo stesso pattern di Inviti:

**`src/pages/admin/AdminCoaches.tsx`** — Rimuovere `toolbar` da SectionShell e aggiungere il bottone come `<div className="mb-4">` prima della Card, identico a Inviti.

**`src/pages/admin/AdminFeedback.tsx`** — Stessa modifica: rimuovere `toolbar`, aggiungere bottone standalone sopra la Card.

Pattern target (da Inviti):
```tsx
<SectionShell title="...">
  <div className="mb-4">
    <Button variant="outline" size="sm" asChild>
      <Link to="/admin">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Home
      </Link>
    </Button>
  </div>
  <Card>...</Card>
</SectionShell>
```

