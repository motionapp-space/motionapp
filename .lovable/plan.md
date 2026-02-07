
# Ridurre dimensione bottone feedback per evitare sovrapposizione

## Problema
Il bottone di feedback (64x64px) si sovrappone alla barra di salvataggio del template editor, entrambi posizionati in basso a destra con `z-50`.

## Soluzione
Ridurre il bottone feedback da `h-16 w-16` (64px) a `h-12 w-12` (48px) e l'icona da `h-6 w-6` a `h-5 w-5`. Il bottone resta visibile e cliccabile ma non copre piu la CTA "Salva".

## File da modificare

| File | Modifica |
|------|----------|
| `src/components/feedback/FeedbackButton.tsx` | Ridurre dimensioni bottone e icona |

## Dettaglio tecnico

```text
Bottone:  h-16 w-16 (64px)  -->  h-12 w-12 (48px)
Icona:    h-6 w-6  (24px)   -->  h-5 w-5  (20px)
```

La posizione (`bottom-8 right-8`) resta invariata. Il bottone piu piccolo lascia spazio sufficiente alla barra di salvataggio sottostante.
