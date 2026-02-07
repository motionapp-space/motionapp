

# Aggiungere bottone Logout alla schermata Admin

## Cosa cambia

Aggiungere un bottone "Esci" nell'header della pagina Admin Dashboard, posizionato nella toolbar di `SectionShell` (area in alto a destra, accanto al titolo).

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/admin/AdminDashboard.tsx` | Aggiungere bottone logout nella toolbar di SectionShell |

## Dettaglio tecnico

- Utilizzare il prop `toolbar` di `SectionShell` per posizionare il bottone in alto a destra
- Importare `supabase` per chiamare `supabase.auth.signOut()`
- Usare l'icona `LogOut` di lucide-react e il componente `Button` esistente
- Variante `outline` per il bottone, coerente con il design system

```tsx
// Toolbar prop di SectionShell
<SectionShell 
  title="Admin Dashboard"
  toolbar={
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Esci
    </Button>
  }
>
```

La funzione `handleLogout` chiamerà `supabase.auth.signOut()` con gestione errori tramite toast.

