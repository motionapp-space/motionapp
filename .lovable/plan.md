

## Favicon dinamica in base al tema (chiaro/scuro)

### Cosa cambia

Inserire le due SVG come favicon e usare l'attributo `media` con `prefers-color-scheme` per far sì che il browser scelga automaticamente la versione corretta in base al tema di sistema.

### File coinvolti

**1. Copiare gli asset nella cartella `public/`**
- `user-uploads://M-white.svg` → `public/favicon-light.svg` (sfondo chiaro, "M" scura — per tema chiaro)
- `user-uploads://M-black.svg` → `public/favicon-dark.svg` (sfondo scuro, "M" chiara — per tema scuro)

**2. Modificare `index.html`**

Aggiungere due tag `<link rel="icon">` con media query:

```html
<link rel="icon" href="/favicon-light.svg" type="image/svg+xml" media="(prefers-color-scheme: light)" />
<link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
```

Questo è lo standard HTML nativo — nessun JavaScript necessario. Il browser sceglie la favicon giusta in base alle preferenze di sistema dell'utente.

### Note
- SVG come favicon è supportato da tutti i browser moderni (Chrome, Firefox, Edge, Safari 15+).
- Se servisse un fallback PNG per browser vecchi si può aggiungere in futuro, ma per ora SVG è sufficiente.

