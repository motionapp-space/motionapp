

# Piano Finale: Uniformazione Tab Client Detail (Motion-Level)

## Riepilogo Aggiornamenti Applicati

| Patch | Descrizione | Impatto |
|-------|-------------|---------|
| Copy fix Italiano | "cosa allenarsi" → "come allenarsi" | `ClientPlansTab.tsx` |
| CTA header sempre visibile | Non condizionale a hasEvents/hasPackages | `ClientAppointmentsTab.tsx`, `PackageTab.tsx` |
| Microcopy più snello | Evitare ripetizioni, tono diretto | `SessionHistoryTab.tsx`, `ClientAppointmentsTab.tsx` |
| Componente TabHeader | Estratto per riusabilità | Nuovo file |
| data-testid | Selettori robusti per test | Tutti i file |
| Test fix | `toHaveCount(0)` invece di `not.toBeVisible()` | Test files |

---

## Modifiche per File

### 1. Nuovo Componente: `src/components/ui/tab-header.tsx`

Componente riutilizzabile per garantire uniformità header:

```typescript
interface TabHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function TabHeader({ title, subtitle, action }: TabHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4" data-testid="tab-header">
      <div>
        <h2 className="text-lg font-semibold" data-testid="tab-header-title">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1" data-testid="tab-header-subtitle">
          {subtitle}
        </p>
      </div>
      {action && (
        <div className="shrink-0" data-testid="tab-header-action">
          {action}
        </div>
      )}
    </div>
  );
}
```

---

### 2. `src/components/ui/empty-state.tsx`

Aggiungere supporto per `secondaryAction` (link testuale):

```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {  // NUOVO
    label: string;
    onClick: () => void;
  };
}

// Nel render, dopo il Button action:
{secondaryAction && (
  <Button 
    variant="link" 
    size="sm" 
    onClick={secondaryAction.onClick}
    className="text-muted-foreground"
  >
    {secondaryAction.label}
  </Button>
)}
```

---

### 3. `src/features/client-plans/components/ClientPlansTab.tsx`

**Modifiche**:
- Size header: `text-2xl` → `text-lg` 
- Fix copy empty state

Linee 51-57 → Usare TabHeader:
```typescript
<TabHeader
  title="Piani di allenamento"
  subtitle="Programmi di allenamento assegnati al cliente e visibili nell'app"
  action={
    <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Nuovo piano
    </Button>
  }
/>
```

Linee 70-78 → Fix copy empty state:
```typescript
<EmptyState
  icon={FileText}
  title="Nessun piano assegnato"
  description="Crea un piano di allenamento per mostrare al cliente come allenarsi e quali esercizi svolgere, e avere una base per le sessioni di allenamento."
  action={{
    label: "Crea nuovo piano",
    onClick: () => setCreateDialogOpen(true),
  }}
/>
```

---

### 4. `src/features/clients/components/ClientAppointmentsTab.tsx`

**Modifiche**:
- Header con TabHeader + subtitle
- CTA **sempre visibile** (rimuovere condizione `upcomingEvents.length > 0 || pastEvents.length > 0`)
- Microcopy educativo (solo quando ci sono eventi)
- Empty state con copy migliorato

Linee 54-62 → Nuovo header:
```typescript
<TabHeader
  title="Appuntamenti"
  subtitle="Eventi a calendario tra te e il cliente, passati e futuri"
  action={
    <Button onClick={handleNewEvent} size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Nuovo appuntamento
    </Button>
  }
/>
```

Dopo header (nuovo blocco):
```typescript
{(upcomingEvents.length > 0 || pastEvents.length > 0) && (
  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
    Un appuntamento rappresenta un incontro. Se durante l'incontro si svolge un allenamento, puoi registrare una sessione di allenamento.
  </p>
)}
```

Linee 67-75 → Empty state aggiornato:
```typescript
<EmptyState
  icon={Calendar}
  title="Nessun appuntamento"
  description="Crea un appuntamento per pianificare un incontro con il cliente, anche se non è previsto un allenamento."
  action={{
    label: "Crea primo appuntamento",
    onClick: handleNewEvent
  }}
/>
```

---

### 5. `src/features/sessions/components/SessionHistoryTab.tsx`

**REVISIONE PROFONDA** - Aggiungere header principale prima dei Tabs interni:

Linee 126-128 → Nuova struttura completa:
```typescript
<div className="space-y-6">
  {/* Header uniforme */}
  <TabHeader
    title="Sessioni di allenamento"
    subtitle="Allenamenti registrati, svolti con te o in autonomia dal cliente tramite l'app"
  />
  {/* NESSUNA CTA - le sessioni si creano da appuntamenti */}

  {/* Microcopy educativo - sempre visibile, copy snello */}
  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 space-y-1">
    <p>Le sessioni di allenamento si registrano da un appuntamento in calendario.</p>
    <p>Il cliente può anche registrare sessioni in autonomia dall'app.</p>
  </div>

  {/* Tabs interni - rimangono invariati */}
  <Tabs defaultValue="with_coach" className="w-full">
    ...
  </Tabs>
</div>
```

Empty state "Con PT" (linee 153-157):
```typescript
<EmptyState
  icon={CalendarPlus}
  title="Nessuna sessione di allenamento registrata"
  description="Le sessioni vengono registrate durante un appuntamento oppure direttamente dal cliente tramite l'app."
  secondaryAction={{
    label: "Vai agli appuntamenti",
    onClick: () => navigate(`/clients/${clientId}?tab=appointments`)
  }}
/>
```

---

### 6. `src/features/packages/components/PackageTab.tsx`

**Modifiche**:
- Header con TabHeader + subtitle corretto
- CTA **sempre visibile** (rimuovere condizione)
- Microcopy educativo (solo quando ci sono pacchetti)
- Title sezione: "Pacchetti attivi" → solo nel subtitle

Linee 115-127 → Nuovo header:
```typescript
<TabHeader
  title="Pacchetti"
  subtitle="Tracciamento delle lezioni acquistate e degli appuntamenti a calendario"
  action={
    <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Nuovo pacchetto
    </Button>
  }
/>
```

Dopo header (nuovo blocco):
```typescript
{(activePackages.length > 0 || completedPackages.length > 0) && (
  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 space-y-1">
    <p>I pacchetti tengono traccia degli appuntamenti a calendario, non delle sessioni di allenamento.</p>
    <p>Le lezioni vengono scalate automaticamente per appuntamenti confermati e cancellazioni tardive (late cancel), se abilitate.</p>
  </div>
)}
```

---

### 7. `src/features/packages/components/PackageEmptyState.tsx`

**Modifiche copy**:
```typescript
<EmptyState
  icon={Package}
  title="Nessun pacchetto attivo"
  description="Crea un pacchetto per gestire le lezioni del cliente e il conteggio automatico degli appuntamenti."
  action={{
    label: "Nuovo pacchetto",
    onClick: onCreatePackage
  }}
/>
```

---

## Riepilogo File da Modificare

| File | Tipo Modifica | Priorità |
|------|---------------|----------|
| `src/components/ui/tab-header.tsx` | **Nuovo** - componente riutilizzabile | Alta |
| `src/components/ui/empty-state.tsx` | Aggiungere prop `secondaryAction` | Media |
| `ClientPlansTab.tsx` | Usare TabHeader, fix copy | Media |
| `ClientAppointmentsTab.tsx` | TabHeader, CTA sempre visibile, microcopy, empty | Alta |
| `SessionHistoryTab.tsx` | Aggiungere header completo, microcopy, fix empty | Alta |
| `PackageTab.tsx` | TabHeader, CTA sempre visibile, microcopy | Alta |
| `PackageEmptyState.tsx` | Copy update | Bassa |

---

## Token CSS Uniformi (Riferimento)

| Elemento | Classi | data-testid |
|----------|--------|-------------|
| Header container | `flex items-start justify-between gap-4` | `tab-header` |
| Title | `text-lg font-semibold` | `tab-header-title` |
| Subtitle | `text-sm text-muted-foreground mt-1` | `tab-header-subtitle` |
| CTA container | `shrink-0` | `tab-header-action` |
| Microcopy box | `text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2` | — |
| Container | `space-y-6` | — |

---

## Test E2E Robusti (Pronti per Lovable)

### A) Struttura UI stabile

```typescript
test('ogni tab ha header coerente e CTA corretta', async ({ page }) => {
  const clientId = 'seed-client-1';
  await page.goto(`/clients/${clientId}`);

  // Piani
  await page.getByTestId('tab-plans').click();
  await expect(page.getByTestId('tab-header-title')).toHaveText('Piani di allenamento');
  await expect(page.getByTestId('tab-header-action')).toBeVisible();

  // Appuntamenti
  await page.getByTestId('tab-appointments').click();
  await expect(page.getByTestId('tab-header-title')).toHaveText('Appuntamenti');
  await expect(page.getByTestId('tab-header-action')).toBeVisible();

  // Sessioni - NESSUNA CTA primaria
  await page.getByTestId('tab-sessions').click();
  await expect(page.getByTestId('tab-header-title')).toHaveText('Sessioni di allenamento');
  await expect(page.getByRole('button', { name: /nuova sessione/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /crea sessione/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /registra sessione/i })).toHaveCount(0);

  // Pacchetti
  await page.getByTestId('tab-packages').click();
  await expect(page.getByTestId('tab-header-title')).toHaveText('Pacchetti');
  await expect(page.getByTestId('tab-header-action')).toBeVisible();
});
```

### B) Modello mentale Sessioni

```typescript
test('sessioni: mostra microcopy e link agli appuntamenti in empty', async ({ page }) => {
  const clientId = 'seed-client-empty-sessions';
  await page.goto(`/clients/${clientId}?tab=sessions`);

  // Microcopy presente
  await expect(page.getByText(/si registrano.*appuntamento/i)).toBeVisible();

  // Link secondario in empty state
  const goToAppointments = page.getByRole('button', { name: 'Vai agli appuntamenti' });
  if (await goToAppointments.count()) {
    await goToAppointments.click();
    await expect(page).toHaveURL(new RegExp(`/clients/${clientId}\\?tab=appointments`));
  }
});
```

### C) Visual regression: screenshot solo header

```typescript
test('visual: header uniforme per tutte le tab', async ({ page }) => {
  const clientId = 'seed-client-1';
  const tabs = ['plans', 'appointments', 'sessions', 'packages'];

  for (const tab of tabs) {
    await page.goto(`/clients/${clientId}?tab=${tab}`);
    await expect(page.getByTestId('tab-header')).toBeVisible();
    await page.getByTestId('tab-header').screenshot({ 
      path: `snapshots/client-detail-header-${tab}.png` 
    });
  }
});
```

### D) Anti-regressione: bottoni proibiti

```typescript
test('sessioni: nessun bottone di creazione diretta', async ({ page }) => {
  await page.goto(`/clients/seed-client-1?tab=sessions`);
  
  // Whitelist di label proibite (specifiche, non generiche)
  const forbiddenButtons = [
    /nuova sessione/i,
    /crea sessione/i,
    /registra sessione/i,
    /avvia sessione/i
  ];
  
  for (const pattern of forbiddenButtons) {
    await expect(page.getByRole('button', { name: pattern })).toHaveCount(0);
  }
});
```

---

## Note Implementative

1. **TabHeader sempre**: ogni tab usa il componente, niente header custom
2. **CTA in header**: sempre visibile dove previsto (Piani, Appuntamenti, Pacchetti)
3. **Sessioni**: NESSUNA CTA primaria - onesto e chiaro
4. **Microcopy**: mostrato solo quando ci sono dati (evita ridondanza con empty state)
5. **data-testid**: obbligatori per selettori robusti
6. **toHaveCount(0)**: per verificare assenza elementi (non `not.toBeVisible()`)

