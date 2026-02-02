

# Piano: Migliorare UI Pagina Registrazione con Invito

## Obiettivo

1. Rimuovere il bottone/tab "Registrati" superfluo (quello nella pill sopra il form)
2. Rendere il banner "Registrazione su invito" coerente con lo stile del sistema

---

## Modifiche

### 1. Rimuovere il tab "Registrati"

Attualmente quando c'e un invito valido, viene mostrato un tab toggle con solo "Registrati" (linee 249-259). Questo e ridondante perche:
- Non c'e alternativa (solo registrazione disponibile)
- Il form sotto ha gia il bottone submit

**Azione**: Rimuovere completamente il blocco che mostra il tab "Registrati" quando `showRegistration` e true.

### 2. Aggiornare stile banner

Il banner attuale usa:
- `border-green-200 bg-green-50` (verde)
- Icona `Mail` verde

Per coerenza con la UI di sistema, usare:
- `bg-[hsl(220,70%,95%)]` (azzurro chiaro, come l'icona principale)
- `border-[hsl(220,70%,90%)]` per il bordo
- Icona con colore `text-primary`
- Testo con colori `text-foreground` e `text-muted-foreground`

---

## Codice da modificare

**File**: `src/pages/Auth.tsx`

### Modifica 1: Tab Toggle (linee 236-261)

Da:
```tsx
{!showInviteLoading && !showInviteError && (
  <>
    {!showRegistration ? (
      // No invite: show only login
      <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
        <button ...>Accedi</button>
      </div>
    ) : (
      // Valid invite: show only registration
      <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
        <button ...>Registrati</button>
      </div>
    )}
  </>
)}
```

A:
```tsx
{!showInviteLoading && !showInviteError && !showRegistration && (
  // No invite: show only login tab
  <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
    <button ...>Accedi</button>
  </div>
)}
```

### Modifica 2: Banner stile (linee 225-234)

Da:
```tsx
<Alert className="border-green-200 bg-green-50">
  <Mail className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">Registrazione su invito</AlertTitle>
  <AlertDescription className="text-green-700">
    Compila il form per creare il tuo account coach.
  </AlertDescription>
</Alert>
```

A:
```tsx
<Alert className="border-[hsl(220,70%,90%)] bg-[hsl(220,70%,95%)] rounded-2xl">
  <Mail className="h-4 w-4 text-primary" />
  <AlertTitle className="text-foreground">Registrazione su invito</AlertTitle>
  <AlertDescription className="text-muted-foreground">
    Compila il form per creare il tuo account coach.
  </AlertDescription>
</Alert>
```

---

## Risultato Visivo

- Il banner avra lo stesso stile azzurro dell'icona principale della pagina
- Non ci sara piu il tab "Registrati" ridondante sopra il form
- L'aspetto sara piu pulito e coerente con il design system

