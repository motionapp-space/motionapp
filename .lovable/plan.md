

# Piano: Aggiornare Nome App da "Studio AI" a "Motion" nei Template Email

## Problema

Tutti i template email usano ancora il vecchio nome "Studio AI" invece del nuovo nome dell'applicazione "Motion".

---

## File da Modificare

### 1. `supabase/functions/_shared/emails/shared/layout.tsx`
Aggiornare 3 occorrenze:
- **Riga 40**: Alt dell'immagine logo → `alt="Motion"`
- **Riga 58**: Testo footer → `"Questa email è stata inviata da Motion."`
- **Riga 61**: Copyright footer → `"© {anno} Motion. Tutti i diritti riservati."`

### 2. `supabase/functions/_shared/emails/shared/styles.ts`
Aggiornare 1 occorrenza:
- **Riga 7**: Commento → `// Motion blue` (opzionale, solo commento)

### 3. `supabase/functions/_shared/emails/client-invite.tsx`
Aggiornare 4 occorrenze:
- **Preview**: `"Sei stato invitato a Motion"`
- **Heading**: `"Benvenuto su Motion"`
- **Body**: `"Sei stato invitato a unirti a Motion per gestire..."`
- **Subject**: `"sei stato invitato a Motion"`

### 4. `supabase/functions/_shared/emails/appointment/accepted-client.tsx`
Aggiornare 1 occorrenza:
- **Body**: `"...accedi a Motion."`

### 5. `supabase/functions/_shared/emails/appointment/cancelled-client.tsx`
Aggiornare 1 occorrenza:
- **Body**: `"...oppure prenota un nuovo slot su Motion."`

### 6. `supabase/functions/_shared/emails/appointment/counter-proposed-client.tsx`
Aggiornare 1 occorrenza:
- **Body**: `"Accedi a Motion per accettare o rifiutare questa proposta."`

### 7. `supabase/functions/_shared/emails/appointment/request-created-coach.tsx`
Aggiornare 1 occorrenza:
- **Body**: `"Accedi a Motion per approvare, modificare o rifiutare la richiesta."`

---

## Riepilogo Modifiche

| Prima | Dopo |
|-------|------|
| Studio AI | Motion |

**Totale occorrenze da aggiornare**: 12 (11 visibili + 1 commento)

---

## Impatto

- Tutte le email inviate mostreranno il nome corretto "Motion"
- Footer aggiornato con copyright "Motion"
- Nessun impatto sulla logica dei template
- Necessario re-deploy dell'edge function `email-worker` per applicare le modifiche

