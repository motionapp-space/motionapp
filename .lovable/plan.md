

## Messaggio completo su hover nella tabella Feedback

Attualmente la colonna "Messaggio" usa `truncate` e taglia il testo. Aggiungere un `HoverCard` che mostra il messaggio completo al passaggio del mouse.

### Modifica

**`src/features/admin/components/FeedbackTable.tsx`** — Wrappare la cella del messaggio in un `HoverCard` (già disponibile in `@/components/ui/hover-card`):

- Il trigger resta il testo troncato attuale
- Il content mostra `f.message` completo con `whitespace-pre-wrap` e larghezza massima ragionevole (`max-w-md`)

