# Client FSM Integration Tests

## Manual Testing Guide

### Bug Fix 1: Assign Plan from POTENZIALE → ATTIVO

**Test Case 1.1: Assign plan to POTENZIALE client**
1. Navigate to Clients page
2. Filter to show only POTENZIALE clients
3. Click on a POTENZIALE client
4. Click "Assign Plan" or "Assign from Template"
5. Fill in plan details and assign
6. **Expected**: Client status badge changes to "Attivo"
7. **Expected**: New plan shows with "In corso" status
8. **Expected**: `active_plan_id` is set in database

**Test Case 1.2: Assign plan to INATTIVO client**
1. Set a client to INATTIVO status (via database or mark inactive)
2. Navigate to that client's detail page
3. Assign a new plan
4. **Expected**: Client becomes ATTIVO

### Bug Fix 2: Unarchive → POTENZIALE

**Test Case 2.1: Unarchive returns POTENZIALE**
1. Archive a client (any status: ATTIVO, INATTIVO, or POTENZIALE)
2. In the clients list, filter to show archived clients
3. Click "Unarchive" on the archived client
4. **Expected**: Client status is POTENZIALE
5. **Expected**: `active_plan_id` is NULL
6. **Expected**: `archived_at` is NULL

**Test Case 2.2: Historical plans remain untouched**
1. Create a client with a completed plan
2. Archive the client
3. Unarchive the client
4. **Expected**: Completed plan still shows as COMPLETATO
5. **Expected**: No plans are IN_CORSO

### Guards & Invariants

**Test Case 3.1: Cannot assign plan to archived client**
1. Archive a client
2. Try to assign a plan
3. **Expected**: Error toast: "Cannot assign plan to archived client"

**Test Case 3.2: One active plan invariant**
1. Assign a plan to a POTENZIALE client (becomes ATTIVO)
2. Assign another plan to the same client
3. **Expected**: First plan auto-completes (COMPLETATO)
4. **Expected**: Second plan becomes the new IN_CORSO
5. **Expected**: Only one IN_CORSO plan exists

**Test Case 3.3: Complete plan → Client becomes POTENZIALE**
1. Have a client with an IN_CORSO plan
2. Complete the plan
3. **Expected**: Plan status is COMPLETATO
4. **Expected**: Client status is POTENZIALE
5. **Expected**: `active_plan_id` is NULL

**Test Case 3.4: Delete plan → Client becomes POTENZIALE**
1. Have a client with an IN_CORSO plan
2. Delete the plan
3. **Expected**: Plan status is ELIMINATO
4. **Expected**: Client status is POTENZIALE
5. **Expected**: `active_plan_id` is NULL

## Database Verification Queries

```sql
-- Check client state logs
SELECT * FROM client_state_logs 
WHERE client_id = 'YOUR_CLIENT_ID' 
ORDER BY created_at DESC;

-- Check plan state logs
SELECT * FROM plan_state_logs 
WHERE client_id = 'YOUR_CLIENT_ID' 
ORDER BY created_at DESC;

-- Verify one active plan constraint
SELECT client_id, COUNT(*) 
FROM client_plans 
WHERE status = 'IN_CORSO' AND is_visible = true 
GROUP BY client_id 
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check unarchived client
SELECT id, status, active_plan_id, archived_at 
FROM clients 
WHERE id = 'YOUR_CLIENT_ID';
-- After unarchive: status='POTENZIALE', active_plan_id=NULL, archived_at=NULL
```

## Expected State Transitions

### Assign Plan Flow
```
POTENZIALE + ASSIGN_PLAN → ATTIVO (with IN_CORSO plan)
INATTIVO + ASSIGN_PLAN → ATTIVO (with IN_CORSO plan)
ARCHIVIATO + ASSIGN_PLAN → ERROR (blocked)
```

### Unarchive Flow
```
ARCHIVIATO + UNARCHIVE_CLIENT → POTENZIALE (active_plan_id=NULL)
```

### Complete/Delete Plan Flow
```
ATTIVO + COMPLETE_PLAN → POTENZIALE (plan=COMPLETATO, active_plan_id=NULL)
ATTIVO + DELETE_PLAN → POTENZIALE (plan=ELIMINATO, active_plan_id=NULL)
```
