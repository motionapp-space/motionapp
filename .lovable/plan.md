

# Piano: Allineamento Spacing dalla Topbar

## Analisi Attuale

Ho analizzato lo spacing (padding-top) nelle pagine richieste confrontandolo con la pagina ClientDetail mostrata nell'immagine:

| Pagina | Classe container | Padding verticale |
|--------|------------------|-------------------|
| **ClientDetail.tsx** (riferimento) | `py-6` | **24px** sopra e sotto ✅ |
| **Library.tsx** | `py-6` | **24px** ✅ già allineato |
| **Settings.tsx** | `py-6` | **24px** ✅ già allineato |
| **Clients.tsx** (stato ZERO_CLIENTS) | Nessun `py-*` | **0px** ❌ da correggere |
| **Clients.tsx** (stato FIRST_CLIENT_NO_CONTENT) | `pt-6` | **24px** ✅ OK |
| **Clients.tsx** (stato normale) | `py-6` | **24px** ✅ OK |

---

## Risultato

**Libreria e Impostazioni sono già allineate** con lo spacing di 24px (`py-6`) dalla topbar, esattamente come la pagina di dettaglio cliente.

L'unica correzione necessaria è nella pagina **Clienti** nello stato `ZERO_CLIENTS` (riga 309), dove manca il padding-top.

---

## Modifica

### File: `src/pages/Clients.tsx`

**Riga 309** - Stato ZERO_CLIENTS container

```diff
- <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
+ <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6">
```

---

## Nota sullo Spacing

Lo spacing di **24px** (`py-6` o `pt-6`) corrisponde a:
- 6 unità Tailwind × 4px = **24px**

Questo valore è coerente con il Design System del progetto e crea una separazione visiva chiara tra la topbar e il contenuto della pagina.

---

## Riepilogo

| Pagina | Azione |
|--------|--------|
| Clienti (ZERO_CLIENTS) | Aggiungere `pt-6` al container |
| Libreria | Nessuna modifica (già `py-6`) |
| Impostazioni | Nessuna modifica (già `py-6`) |

