

# Piano: Card Header "Strong" senza Divider

## Obiettivo

Rafforzare la percezione del titolo delle card senza aumentare font-size e senza linee divisorie, usando:
- Gerarchia tipografica (title 16px vs description 13px)
- Spaziatura coerente (header `pb-4`, content `pt-0`)
- Micro-contrasto (subtitle più secondario)

---

## Modifiche per File

### 1. `src/components/ui/card.tsx`

**Linea 19 — CardTitle: tornare a 16px con `text-foreground`**

```typescript
// Da:
<h3 ref={ref} className={cn("text-[17px] font-semibold leading-6", className)} {...props} />

// A:
<h3 ref={ref} className={cn("text-base font-semibold leading-6 text-foreground", className)} {...props} />
```

**Linea 26 — CardDescription: 13px più secondario**

```typescript
// Da:
<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />

// A:
<p ref={ref} className={cn("text-[13px] leading-5 text-muted-foreground", className)} {...props} />
```

---

### 2. `src/pages/ClientDetail.tsx`

Applicare pattern header coerente a tutte le card del tab Profile:

**Card "Accesso app cliente" (linee 217-234)**

```typescript
<Card>
  <CardHeader className="pb-4">
    <CardTitle className="flex items-center gap-2">
      <Smartphone className="h-4 w-4 text-muted-foreground" />
      {toSentenceCase("Accesso app cliente")}
    </CardTitle>
    <CardDescription className="mt-1">
      Stato di accesso del cliente all'app e azioni disponibili
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-0">
    ...
  </CardContent>
</Card>
```

**Card "Informazioni personali" (linee 237-256)**

```typescript
<Card>
  <CardHeader className="pb-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <CardTitle>{toSentenceCase("Informazioni personali")}</CardTitle>
        <CardDescription className="mt-1">
          Dati anagrafici e di contatto del cliente
        </CardDescription>
      </div>
      {!editMode && (
        <Button variant="ghost" size="icon" onClick={() => setEditMode(true)} className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent className="pt-0 space-y-4">
    ...
  </CardContent>
</Card>
```

**Card "Tags" (linee 347-379)**

```typescript
<Card>
  <CardHeader className="pb-4">
    <CardTitle>{toSentenceCase("Tags")}</CardTitle>
    <CardDescription className="mt-1">
      Etichette per organizzare e filtrare i clienti
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-0 space-y-4">
    ...
  </CardContent>
</Card>
```

**Card "Misurazioni" (linee 383-395)**

```typescript
<Card>
  <CardHeader className="pb-4">
    <CardTitle>{toSentenceCase("Misurazioni")}</CardTitle>
    <CardDescription className="mt-1">
      Dati fisici e metriche di monitoraggio
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-0">
    ...
  </CardContent>
</Card>
```

**Card "Cronologia modifiche" (linee 398-420)**

```typescript
<Card>
  <CardHeader className="pb-4">
    <CardTitle>{toSentenceCase("Cronologia modifiche")}</CardTitle>
    <CardDescription className="mt-1">
      Storico delle azioni e delle modifiche sul profilo
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-0">
    ...
  </CardContent>
</Card>
```

---

## Riepilogo Modifiche

| File | Elemento | Modifica |
|------|----------|----------|
| `card.tsx` | CardTitle | `text-[17px]` → `text-base text-foreground` (16px) |
| `card.tsx` | CardDescription | `text-sm` → `text-[13px] leading-5` |
| `ClientDetail.tsx` | Tutte le Card | `pb-2` → `pb-4`, `<p>` → `<CardDescription>`, `pt-0` su CardContent |
| `ClientDetail.tsx` | Icona Smartphone | `h-5 w-5` → `h-4 w-4 text-muted-foreground` |

---

## Scala Tipografica Risultante

| Livello | Tailwind | Pixel | Uso |
|---------|----------|-------|-----|
| H1 | `text-lg font-semibold leading-6` | 18px | Titolo tab (TabHeader) |
| H2 | `text-sm font-medium text-muted-foreground leading-5` | 14px | Subtitle tab |
| H3 | `text-base font-semibold leading-6 text-foreground` | 16px | CardTitle |
| Caption | `text-[13px] leading-5 text-muted-foreground` | 13px | CardDescription |
| Body | `text-sm leading-5` | 14px | Testo standard |
| Label | `text-xs font-medium` | 12px | Badge/stati |

---

## Note

- **Nessun tracking negativo nel default**: evita effetti collaterali su titoli lunghi
- **`pb-4` su CardHeader**: crea "chiusura" visiva del blocco header
- **`pt-0` su CardContent**: il padding è già gestito da CardHeader
- **CardDescription con `mt-1`**: micro-gap tra titolo e descrizione
- **Icone `h-4 w-4`**: coerenti con la scala ridotta

