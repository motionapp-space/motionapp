import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

describe('Client FSM', () => {
  let supabase: any;
  let testUserId: string;
  let testClientId: string;

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Sign in test user (you'll need to create this)
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });
    testUserId = authData.user?.id;

    // Create a test client
    const { data: client } = await supabase
      .from('clients')
      .insert({
        first_name: 'Test',
        last_name: 'Client',
        status: 'POTENZIALE',
        coach_id: testUserId,
      })
      .select()
      .single();
    
    testClientId = client.id;
  });

  describe('Bug Fix 1: Assign plan from POTENZIALE activates client', () => {
    it('should set client to ATTIVO when assigning plan from POTENZIALE', async () => {
      // Arrange: client is POTENZIALE
      expect(testClientId).toBeDefined();

      // Act: Assign a plan
      const { data, error } = await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ASSIGN_PLAN',
          clientId: testClientId,
          metadata: {
            name: 'Test Plan',
            description: 'Test Description',
            data: { days: [] },
          },
        },
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);

      // Assert: Client should be ATTIVO
      const { data: updatedClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      expect(updatedClient.status).toBe('ATTIVO');
      expect(updatedClient.active_plan_id).not.toBeNull();

      // Assert: Plan should be IN_CORSO
      const { data: plans } = await supabase
        .from('client_plans')
        .select('*')
        .eq('client_id', testClientId)
        .eq('status', 'IN_CORSO');

      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Test Plan');

      // Assert: Logs should be created
      const { data: clientLogs } = await supabase
        .from('client_state_logs')
        .select('*')
        .eq('client_id', testClientId)
        .eq('cause', 'ASSIGN_PLAN');

      expect(clientLogs).toHaveLength(1);
      expect(clientLogs[0].from_status).toBe('POTENZIALE');
      expect(clientLogs[0].to_status).toBe('ATTIVO');
    });

    it('should set client to ATTIVO when assigning plan from INATTIVO', async () => {
      // Arrange: Set client to INATTIVO
      await supabase
        .from('clients')
        .update({ status: 'INATTIVO' })
        .eq('id', testClientId);

      // Act: Assign a plan
      const { data } = await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ASSIGN_PLAN',
          clientId: testClientId,
          metadata: {
            name: 'Test Plan',
            data: { days: [] },
          },
        },
      });

      expect(data.success).toBe(true);

      // Assert: Client should be ATTIVO
      const { data: updatedClient } = await supabase
        .from('clients')
        .select('status')
        .eq('id', testClientId)
        .single();

      expect(updatedClient.status).toBe('ATTIVO');
    });
  });

  describe('Bug Fix 2: Unarchive always returns POTENZIALE', () => {
    it('should set client to POTENZIALE and clear active_plan_id when unarchiving', async () => {
      // Arrange: Archive the client
      await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ARCHIVE_CLIENT',
          clientId: testClientId,
        },
      });

      // Verify archived
      const { data: archivedClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      expect(archivedClient.status).toBe('ARCHIVIATO');

      // Act: Unarchive
      const { data } = await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'UNARCHIVE_CLIENT',
          clientId: testClientId,
        },
      });

      expect(data.success).toBe(true);

      // Assert: Client should be POTENZIALE with no active plan
      const { data: unarchivedClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      expect(unarchivedClient.status).toBe('POTENZIALE');
      expect(unarchivedClient.active_plan_id).toBeNull();
      expect(unarchivedClient.archived_at).toBeNull();

      // Assert: Log should reflect transition
      const { data: logs } = await supabase
        .from('client_state_logs')
        .select('*')
        .eq('client_id', testClientId)
        .eq('cause', 'UNARCHIVE_CLIENT');

      expect(logs).toHaveLength(1);
      expect(logs[0].from_status).toBe('ARCHIVIATO');
      expect(logs[0].to_status).toBe('POTENZIALE');
    });
  });

  describe('Guards and Invariants', () => {
    it('should block ASSIGN_PLAN on archived client', async () => {
      // Arrange: Archive client
      await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ARCHIVE_CLIENT',
          clientId: testClientId,
        },
      });

      // Act: Try to assign plan
      const { data, error } = await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ASSIGN_PLAN',
          clientId: testClientId,
          metadata: { name: 'Test Plan', data: { days: [] } },
        },
      });

      // Assert: Should fail
      expect(data.error).toBeDefined();
      expect(data.error).toContain('archived');
    });

    it('should enforce one active plan invariant', async () => {
      // Arrange: Assign first plan
      await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ASSIGN_PLAN',
          clientId: testClientId,
          metadata: { name: 'First Plan', data: { days: [] } },
        },
      });

      // Act: Try to assign second plan (should auto-complete first)
      const { data } = await supabase.functions.invoke('client-fsm', {
        body: {
          action: 'ASSIGN_PLAN',
          clientId: testClientId,
          metadata: { name: 'Second Plan', data: { days: [] } },
        },
      });

      expect(data.success).toBe(true);

      // Assert: Should have exactly one IN_CORSO plan
      const { data: activePlans } = await supabase
        .from('client_plans')
        .select('*')
        .eq('client_id', testClientId)
        .eq('status', 'IN_CORSO');

      expect(activePlans).toHaveLength(1);
      expect(activePlans[0].name).toBe('Second Plan');

      // Assert: First plan should be COMPLETATO
      const { data: completedPlans } = await supabase
        .from('client_plans')
        .select('*')
        .eq('client_id', testClientId)
        .eq('status', 'COMPLETATO');

      expect(completedPlans).toHaveLength(1);
      expect(completedPlans[0].name).toBe('First Plan');
    });
  });
});
