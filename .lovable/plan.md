

## Allineamento template email al design system Motion

### Problema attuale

I template email usano uno stile vecchio (blu `#2264d1`, sfondo bianco puro `#ffffff`) che non riflette il design system "Motion Editorial" della piattaforma, basato su colori "Ink" (quasi nero) e superfici "Editorial White" (non bianco puro).

Inoltre, il logo nell'header e' un'immagine caricata su Supabase Storage (`logo.png`). La piattaforma stessa usa il testo "Motion" come logo (senza immagine). L'immagine potrebbe non esistere o non essere accessibile, causando un header vuoto nelle email.

### Modifiche previste

**1. `styles.ts` - Aggiornamento palette colori**

| Token | Vecchio valore | Nuovo valore | Motivazione |
|---|---|---|---|
| `primary` | `#2264d1` (blu) | `#191d23` (Ink) | Allineamento al Primary "Ink" della piattaforma |
| `primaryDark` | `#1a4fa8` | `#121518` | Hover coerente con Ink |
| `background` | `#ffffff` | `#f9fafb` | Editorial White (HSL 220 14% 98%) |
| `backgroundMuted` | `#f5f5f5` | `#f2f3f5` | Muted surface coerente |
| `text` | `#333333` | `#191d23` | Foreground Ink |
| `textMuted` | `#666666` | `#6b7280` | Muted foreground allineato |
| `border` | `#e5e5e5` | `#e2e4e8` | Border token allineato |

**2. `layout.tsx` - Logo testuale al posto dell'immagine**

Sostituire il tag `<img>` con testo "Motion" in stile bold, coerente con la sidebar dell'app. Questo garantisce che il logo sia sempre visibile indipendentemente dalla disponibilita' dell'immagine su Storage.

L'header avra' sfondo scuro "Ink" con testo bianco, richiamando la "Dark Signature" della sidebar.

**3. `button.tsx` - CTA con stile Ink**

Il pulsante primary usera' sfondo Ink (quasi nero) con testo bianco, coerente con i pulsanti CTA della piattaforma. Border radius aggiornato a `8px` (coerente con `--radius: 1rem` del design system).

**4. `info-box.tsx` - Varianti aggiornate**

- Variante `highlight`: sfondo con tinta Ink leggera invece del blu
- Variante `warning`: invariata (gia' coerente col token semantico)

### Dettagli tecnici

File modificati (tutti in `supabase/functions/_shared/emails/shared/`):
- `styles.ts` — nuova palette colori
- `layout.tsx` — header con logo testuale "Motion" su sfondo Ink
- `button.tsx` — border-radius aggiornato (palette cambia automaticamente via styles.ts)
- `info-box.tsx` — variante highlight aggiornata

Nessun template email (client-invite, appointment/*) richiede modifiche: usano tutti i componenti shared che vengono aggiornati centralmente.

Dopo le modifiche, sara' necessario fare il deploy della edge function `email-worker` per applicare i nuovi stili.

