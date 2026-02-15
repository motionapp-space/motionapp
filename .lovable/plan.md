

## Ignorare il finding `SUPA_rls_enabled_no_policy` per `email_messages`

### Cosa faremo

Segneremo il finding come "ignorato" nello scanner di sicurezza con la motivazione che il comportamento e' intenzionale: la tabella `email_messages` e' progettata per essere accessibile solo tramite service role (edge functions), e l'assenza di policy RLS garantisce il "default deny" per tutti gli utenti.

### Dettagli tecnici

Verra' eseguita una chiamata a `security--manage_security_finding` con:
- **Operazione**: `update`
- **internal_id**: `SUPA_rls_enabled_no_policy`
- **scanner_name**: `supabase`
- **ignore**: `true`
- **ignore_reason**: La tabella `email_messages` e' intenzionalmente senza policy RLS. L'accesso e' riservato esclusivamente al service role (edge functions). Il "default deny" di RLS senza policy e' il comportamento desiderato.

Nessuna modifica al codice o al database.

