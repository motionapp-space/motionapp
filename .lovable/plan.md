

## Correggere lo scorrimento della pagina /client/auth su mobile

### Problema
Due cause contribuiscono allo scroll:

1. **`App.css`** applica `padding: 2rem` a `#root`, aggiungendo 32px di padding extra attorno a tutto il contenuto. Questo spinge il form fuori dall'area visibile.
2. **`min-h-screen`** usa `100vh`, che su Safari mobile include l'altezza della barra degli indirizzi, risultando piu' alto del viewport visibile.

### Soluzione

**File 1: `src/App.css`**
- Rimuovere `padding: 2rem` da `#root` (residuo del template Vite, non usato dall'app)
- Questo file contiene solo stili legacy del boilerplate Vite. Le regole rimanenti (`.logo`, `.card`, `.read-the-docs`) non sono usate dall'app e possono essere rimosse per pulizia, oppure lasciate.

**File 2: `src/pages/client/ClientAuth.tsx`**
- Cambiare il container esterno da `min-h-screen` a `min-h-[100dvh]`
- `100dvh` (dynamic viewport height) si adatta automaticamente alla barra degli indirizzi su mobile, evitando overflow
- Questo garantisce che la pagina occupi esattamente il viewport visibile senza scorrimento

### Dettaglio tecnico

```css
/* App.css - rimuovere padding da #root */
#root {
  max-width: 1280px;
  margin: 0 auto;
  /* padding: 2rem rimosso */
  text-align: center;
}
```

```tsx
// ClientAuth.tsx riga 65 - prima
<div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">

// dopo
<div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(0,0%,96%)] p-4">
```

### Verifica da fare
Controllare che la pagina `/auth` (coach login) non sia impattata dalla rimozione del padding in `App.css` -- usa lo stesso pattern `min-h-screen` e dovrebbe beneficiare della stessa correzione.

