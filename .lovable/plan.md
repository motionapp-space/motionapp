
# Piano: Allineamento Icone con Titoli Sezione

## Problema Identificato

L'icona `CreditCard` (e `Package`) usa `mt-0.5` che non allinea correttamente l'icona al centro visivo del titolo `text-lg font-semibold`.

Con `text-lg` (18px con line-height ~28px), l'icona da 20px (`h-5 w-5`) necessita di un offset maggiore per apparire centrata rispetto alla prima riga del titolo.

## Soluzione

Cambiare l'allineamento delle icone da `mt-0.5` a `mt-1` per entrambe le sezioni.

---

## File: `ProductCatalogSettings.tsx`

### Modifica 1 — Icona "Lezione singola" (riga 104)

```diff
- <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
+ <CreditCard className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
```

### Modifica 2 — Icona "Pacchetti di lezioni" (riga 134)

```diff
- <Package className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
+ <Package className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
```

---

## Riepilogo

| Riga | Modifica |
|------|----------|
| 104 | `mt-0.5` → `mt-1` su CreditCard |
| 134 | `mt-0.5` → `mt-1` su Package |

## Risultato

Le icone saranno allineate verticalmente al centro del titolo `text-lg`, creando un allineamento visivo pixel-perfect.
