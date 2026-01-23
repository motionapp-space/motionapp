

# Piano: Sistema Notifiche Area Cliente

## Panoramica

Sostituire la sezione "Attività recenti" con un sistema di notifiche completo per l'area cliente, in linea con quanto implementato lato Coach:
- **Campanella nella topbar** con badge unread
- **Pagina notifiche dedicata** (`/client/app/notifications`) con filtri e raggruppamento per data
- **Notifiche persistenti in database** tramite trigger PostgreSQL

---

## Tipi di Notifica per il Cliente

| Evento | Tipo DB | Titolo | Messaggio |
|--------|---------|--------|-----------|
| Appuntamento confermato | `appointment_confirmed` | Appuntamento confermato | "Appuntamento del DD/MM alle HH:MM confermato" |
| Appuntamento annullato dal coach | `appointment_canceled_by_coach` | Appuntamento annullato | "Il coach ha annullato l'appuntamento del DD/MM" |
| Cliente annulla appuntamento (conferma) | `appointment_canceled_confirmed` | Annullamento confermato | "Hai annullato l'appuntamento del DD/MM" |
| Proposta nuovo orario dal coach | `counter_proposal_received` | Proposta nuovo orario | "Il coach propone un nuovo orario: DD/MM alle HH:MM" |
| Richiesta annullata (dal cliente) | `booking_request_canceled` | Richiesta annullata | "Hai annullato la richiesta del DD/MM" |
| Richiesta rifiutata dal coach | `booking_request_declined` | Richiesta rifiutata | "La tua richiesta del DD/MM è stata rifiutata" |

---

## Fase 1: Schema Database

### Creare tabella `client_notifications`

```sql
CREATE TABLE client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'appointment_confirmed',
    'appointment_canceled_by_coach',
    'appointment_canceled_confirmed',
    'counter_proposal_received',
    'booking_request_canceled',
    'booking_request_declined'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  related_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Indexes
CREATE INDEX idx_client_notifications_client_id ON client_notifications(client_id);
CREATE INDEX idx_client_notifications_is_read ON client_notifications(client_id, is_read);

-- RLS
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own notifications"
  ON client_notifications FOR SELECT
  USING (client_id IN (
    SELECT c.id FROM clients c WHERE c.auth_user_id = auth.uid()
  ));

CREATE POLICY "Clients can update own notifications"
  ON client_notifications FOR UPDATE
  USING (client_id IN (
    SELECT c.id FROM clients c WHERE c.auth_user_id = auth.uid()
  ));
```

---

## Fase 2: Trigger per Generare Notifiche

### Trigger 1: Appuntamento Confermato
Fires quando `booking_requests.status` passa a `APPROVED`:
```sql
CREATE FUNCTION notify_client_booking_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status IS DISTINCT FROM 'APPROVED' THEN
    INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'appointment_confirmed',
      'Appuntamento confermato',
      'Appuntamento del ' || to_char(NEW.requested_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI') || ' confermato'
    FROM coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger 2: Appuntamento Annullato dal Coach
Fires quando `events.session_status` diventa `canceled` E l'attore è il coach:
```sql
CREATE FUNCTION notify_client_appointment_canceled_by_coach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_status = 'canceled' 
     AND (OLD.session_status IS NULL OR OLD.session_status != 'canceled')
     AND NEW.canceled_by = 'coach' THEN
    INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'appointment_canceled_by_coach',
      'Appuntamento annullato',
      'Il coach ha annullato l''appuntamento del ' || to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI')
    FROM coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger 3: Conferma Annullamento (Cliente annulla)
Fires quando il cliente annulla (session_status = 'canceled' + canceled_by = 'client'):
```sql
CREATE FUNCTION notify_client_appointment_canceled_confirmed()
...
```

### Trigger 4: Proposta Nuovo Orario
Fires quando `booking_requests.status` diventa `COUNTER_PROPOSED`:
```sql
CREATE FUNCTION notify_client_counter_proposal_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COUNTER_PROPOSED' AND OLD.status != 'COUNTER_PROPOSED' THEN
    INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'counter_proposal_received',
      'Proposta nuovo orario',
      'Il coach propone: ' || to_char(NEW.counter_proposed_start_at AT TIME ZONE 'Europe/Rome', 'DD Mon "alle" HH24:MI')
    FROM coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger 5: Richiesta Rifiutata
Fires quando `booking_requests.status` diventa `DECLINED`:
```sql
CREATE FUNCTION notify_client_booking_declined()
...
```

### Trigger 6: Richiesta Annullata dal Cliente
Fires quando `booking_requests.status` diventa `CANCELED_BY_CLIENT`:
```sql
CREATE FUNCTION notify_client_booking_canceled()
...
```

---

## Fase 3: Feature Module Client Notifications

### Struttura File

```
src/features/client-notifications/
├── api/
│   └── client-notifications.api.ts    # listClientNotifications, markAsRead, markAllAsRead
├── components/
│   ├── ClientNotificationBell.tsx     # Campanella per topbar
│   ├── ClientNotificationItem.tsx     # Item singolo (riutilizza design esistente)
│   └── ClientNotificationList.tsx     # Lista con raggruppamento
├── hooks/
│   ├── useClientNotificationsQuery.ts # Query con polling 30s
│   └── useClientMarkAsRead.ts         # Mutations markOne/markAll
├── utils/
│   └── groupByDate.ts                 # Riutilizza da notifications/utils
└── types.ts                           # ClientNotificationType, ClientNotification
```

### API (`client-notifications.api.ts`)

```typescript
export async function listClientNotifications(): Promise<ClientNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get client_id from auth_user_id
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) throw new Error("Client not found");

  const { data, error } = await supabase
    .from("client_notifications")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}
```

---

## Fase 4: Componenti UI

### ClientNotificationBell.tsx
```typescript
// Struttura identica a NotificationBell.tsx ma con:
// - useClientNotificationsQuery()
// - useClientMarkAsRead()
// - Navigate to /client/app/notifications
// - Dropdown max 10 items
```

### ClientNotificationItem.tsx
```typescript
// Icon mapping per tipi cliente:
function getNotificationIcon(type: ClientNotificationType) {
  switch (type) {
    case "appointment_confirmed":
      return CheckCircle; // Verde
    case "appointment_canceled_by_coach":
    case "appointment_canceled_confirmed":
      return XCircle;     // Rosso
    case "counter_proposal_received":
      return Clock;       // Giallo/Arancione
    case "booking_request_declined":
    case "booking_request_canceled":
      return XCircle;     // Grigio
  }
}
```

---

## Fase 5: Integrazione Topbar

### Modificare `ClientTopbar.tsx`

```typescript
import { ClientNotificationBell } from "@/features/client-notifications/components/ClientNotificationBell";

const ClientTopbar = () => {
  return (
    <header className="...">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span>Motion</span>
          <span>Area Cliente</span>
        </div>
        
        {/* Actions: Bell + User Menu */}
        <div className="flex items-center gap-1">
          <ClientNotificationBell />
          <ClientUserMenu />
        </div>
      </div>
    </header>
  );
};
```

---

## Fase 6: Pagina Notifiche Dedicata

### Creare `/client/app/notifications`

File: `src/pages/client/ClientNotifications.tsx`

```typescript
// Struttura identica a pages/Notifications.tsx ma con:
// - useClientNotificationsQuery()
// - useClientMarkAsRead()
// - ClientNotificationList
// - Container responsive con ClientPageShell
```

### Aggiungere Route in App.tsx

```typescript
<Route path="/client/app" element={<ClientAppLayout />}>
  <Route index element={<Navigate to="workouts" replace />} />
  <Route path="workouts" element={<ClientWorkouts />} />
  <Route path="appointments" element={<ClientAppointments />} />
  <Route path="appointments/all" element={<ClientAllAppointments />} />
  <Route path="notifications" element={<ClientNotifications />} />  {/* NEW */}
</Route>
```

---

## Fase 7: Rimuovere Legacy "Attività Recenti"

### File da eliminare:
- `src/features/client-bookings/api/client-recent-activity.api.ts`
- `src/features/client-bookings/components/RecentActivitySection.tsx`
- `src/features/client-bookings/hooks/useClientRecentActivity.ts`

### Modificare `ClientBookingsPage.tsx`:
- Rimuovere import `RecentActivitySection`
- Rimuovere hook `useClientRecentActivity`
- Rimuovere sezione 4 "Recent Activity"

---

## Riepilogo Modifiche

| Fase | Tipo | Elemento |
|------|------|----------|
| 1 | DB | Creare tabella `client_notifications` |
| 2 | DB | Creare 6 trigger PostgreSQL |
| 3 | Code | Creare feature module `client-notifications/` |
| 4 | Code | Componenti ClientNotificationBell, Item, List |
| 5 | Code | Modificare `ClientTopbar.tsx` (aggiungere Bell) |
| 6 | Code | Creare pagina `ClientNotifications.tsx` + route |
| 7 | Code | Rimuovere legacy RecentActivity |

---

## Considerazioni Tecniche

### Riutilizzo Codice
- `groupByDate.ts` e `formatRelativeTime.ts` possono essere riutilizzati da `notifications/utils/`
- Design pattern identico a Coach per coerenza UX

### RLS e Sicurezza
- I client possono vedere/aggiornare SOLO le proprie notifiche
- Join tramite `clients.auth_user_id = auth.uid()`

### Performance
- Polling ogni 30 secondi (come coach)
- Limite 50 notifiche per query
- Indice su `(client_id, is_read)` per filtri veloci

