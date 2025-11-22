# Event Modals Architecture

## Overview
Architettura semplificata per gestione appuntamenti con separazione netta tra flusso coach e flusso cliente.

---

## 🆕 EventEditorModal (Coach Primary)

**Path**: `EventEditorModal.tsx`  
**Purpose**: Modale unificata per creazione e modifica appuntamenti da parte del coach

### Features
- ✅ Modalità new/edit unificate
- ✅ Piena libertà su slot (no vincoli availability)
- ✅ Ricorrenze (daily, weekly, monthly, yearly)
- ✅ Promemoria configurabili
- ✅ Controllo automatico crediti pacchetto
- ✅ Warning overlap (soft, non bloccante)
- ✅ Note interne coach-only
- ✅ UI Google Calendar-inspired

### When to Use
- Click "Nuovo appuntamento" dal calendario
- Drag-to-create sul calendario
- Click su evento per modificarlo
- Da ClientAppointmentsTab con cliente pre-selezionato

### Props
```typescript
interface EventEditorModalProps {
  mode: 'new' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  initialDate?: Date;
  initialStartTime?: Date;
  initialEndTime?: Date;
  lockedClientId?: string;
  event?: EventWithClient;
  onStartSession?: (...) => void;
}
```

### UI Sections
1. **Dettagli**: Titolo, Cliente (required), Luogo
2. **Quando**: Data (DatePicker), Dalle/Alle (Select 15min), Durata (auto-calcolata)
3. **Ricorrenza**: Switch + RecurrenceSection (solo mode='new')
4. **Promemoria**: Select (0, 15min, 1h, 24h)
5. **Note Interne**: Textarea

### Validations
- **Hard** (bloccanti):
  - Cliente obbligatorio
  - Titolo non vuoto
  - End time > Start time
  - Ricorrenza: occorrenze ≤ crediti disponibili

- **Soft** (warning non bloccanti):
  - Overlap con altri eventi
  - Cliente senza pacchetto attivo

---

## 👤 ClientAppointmentModal (Client Booking)

**Path**: `ClientAppointmentModal.tsx`  
**Purpose**: Booking clienti con vincoli slot

### Features
- ✅ Slot-based (availability windows)
- ✅ Out-of-office blocks
- ✅ Min advance notice
- ✅ Buffer times
- ❌ No ricorrenze (coach-only)
- 🔮 Promemoria futuri

### When to Use
- Client booking da calendario pubblico coach
- Prenotazioni self-service
- Booking requests

---

## 🔀 EventModal (Router)

**Path**: `EventModal.tsx`  
**Purpose**: Smart router tra modali

### Logic
```
if (mode === 'client-booking') → ClientAppointmentModal
else → EventEditorModal
```

---

## 🧹 Removed Components

I seguenti componenti sono stati eliminati e sostituiti da EventEditorModal:
- ❌ UnifiedAppointmentModal.tsx
- ❌ CoachAppointmentModal.tsx
- ❌ BookingModalSimple.tsx

Rationale: EventEditorModal fornisce tutte le funzionalità necessarie per il coach con una UI più pulita e consistente.

---

## 🎨 Design System

### UI Components (shadcn/ui)
- `Dialog` - container modale
- `Input`, `Select`, `Textarea` - form controls
- `DatePicker` (Calendar + Popover)
- `Button` - actions
- `Alert` - warnings e info
- `AlertDialog` - conferme

### Layout
- Max width: 860px
- Max height: 90vh con scroll
- Sticky header e footer
- Sections con spacing consistente
- Responsive grid per date/time

### Design Tokens
- Typography: text-sm default
- Spacing: space-y-4 / space-y-6
- Colors: semantic tokens (destructive, muted, etc.)
- Border radius: rounded-lg / rounded-xl
- Icons: lucide-react (size 4-5)

### Consistency
- Labels con asterisco per campi required
- Placeholder descrittivi
- Alert con icone contestuali
- Button variants appropriate (destructive per delete, outline per cancel, default per primary action)

---

## 🧪 Testing Strategy

### Unit Tests
- Form validation logic
- Duration calculation
- Occurrence generation
- Credits calculation

### Integration Tests
1. **Creazione evento singolo**
   - Click "Nuovo" → compila form → submit
   - Verifica evento nel DB
   - Verifica toast success

2. **Creazione eventi ricorrenti**
   - Attiva ricorrenza
   - Imposta 5 occorrenze settimanali
   - Verifica 5 eventi creati

3. **Modifica evento**
   - Click su evento → modifica titolo → salva
   - Verifica update nel DB

4. **Eliminazione evento**
   - Click elimina → conferma
   - Verifica rimozione dal DB

5. **Controllo crediti pacchetto**
   - Cliente con 3 crediti
   - Prova a creare 5 occorrenze
   - Verifica alert error + submit bloccato

6. **Overlap warning**
   - Evento esistente 10:00-11:00
   - Crea nuovo 10:30-11:30
   - Verifica warning visualizzato (non bloccante)

7. **Client locked**
   - Apri da ClientAppointmentsTab
   - Verifica campo Cliente disabled
   - Verifica cliente pre-selezionato

8. **Start session**
   - Apri evento in edit
   - Click "Avvia sessione"
   - Verifica callback chiamato

### Regression Tests
- ✅ ClientAppointmentModal funziona
- ✅ Calendario rendering corretto
- ✅ Views (Day/Week/Month) funzionano
- ✅ EventCard rendering
- ✅ Package integration
- ✅ Booking settings rispettate

---

## 📐 Architecture Benefits

### Semplicità
- Una sola modale per tutte le operazioni coach
- Logica unificata new/edit
- Props interface chiara

### Manutenibilità
- Codice self-contained
- Responsabilità separate
- Type-safe con TypeScript

### Testabilità
- Logica isolata
- Hooks ben definiti
- Coverage completo possibile

### UX Consistente
- Design system coerente
- Feedback immediato (warnings, validazioni)
- Google Calendar style familiare

### Scalabilità
- Facile aggiungere nuove features
- Architettura modulare
- Riutilizzo componenti (RecurrenceSection)

---

## 🚀 Future Enhancements

### Possibili Miglioramenti
1. **Promemoria clienti**: Aggiungere opzione per inviare promemoria ai clienti
2. **Templates**: Salvare configurazioni ricorrenti comuni
3. **Bulk actions**: Operazioni su eventi multipli
4. **Drag & drop**: Riordinare eventi nel calendario
5. **Conflict resolution**: Suggerimenti automatici per risolvere overlap
6. **Smart scheduling**: AI-powered slot suggestions

### Roadmap
- [ ] Fase 1: Stabilizzazione e bug fixes (Q1)
- [ ] Fase 2: Promemoria clienti (Q2)
- [ ] Fase 3: Templates e bulk actions (Q3)
- [ ] Fase 4: AI features (Q4)

---

## 📝 Notes

### Data Flow
```
EventModal (router)
  ↓
  ├─→ mode='client-booking' → ClientAppointmentModal
  └─→ default → EventEditorModal
                  ↓
                  ├─→ useCreateEvent
                  ├─→ useUpdateEvent
                  ├─→ useDeleteEvent
                  └─→ RecurrenceSection
```

### Key Design Decisions
1. **Unified Modal**: Una modale invece di due separate per new/edit riduce duplicazione
2. **Recurrence Only in New**: La modifica di eventi ricorrenti è complessa, meglio eliminare e ricreare
3. **Soft Overlap Warning**: Coach ha libertà di creare overlap se necessario
4. **Hard Credit Check**: Protezione fondamentale per business logic
5. **Client Locked**: Da ClientAppointmentsTab il cliente è pre-selezionato per UX migliore

### Performance Considerations
- `useMemo` per calcoli pesanti (duration, occurrences, credits)
- Eventi caricati solo quando necessario (query con date range)
- Form state locale (no redux) per responsiveness
- Debounce su validazioni real-time future

---

**Last Updated**: 2025-01-22  
**Version**: 1.0.0  
**Maintainer**: Development Team
