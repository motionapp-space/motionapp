import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with SERVICE_ROLE_KEY for elevated permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log("[auto-complete-events] Starting auto-completion job");

    // Query past events that are still scheduled
    const { data: pastEvents, error: queryError } = await supabaseClient
      .from('events')
      .select('id, client_id, start_at')
      .eq('session_status', 'scheduled')
      .lt('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(100); // Process max 100 per execution to avoid timeout

    if (queryError) {
      console.error("[auto-complete-events] Query error:", queryError);
      throw queryError;
    }

    console.log(`[auto-complete-events] Found ${pastEvents?.length || 0} past scheduled events`);

    let completed = 0, skipped = 0, errors = 0;

    if (pastEvents && pastEvents.length > 0) {
      for (const event of pastEvents) {
        try {
          console.log(`[auto-complete-events] Processing event ${event.id}`);

          // Find package_id in ledger
          const { data: ledgerEntry } = await supabaseClient
            .from('package_ledger')
            .select('package_id')
            .eq('calendar_event_id', event.id)
            .maybeSingle();

          if (!ledgerEntry?.package_id) {
            console.log(`[auto-complete-events] No package found for event ${event.id}, skipping`);
            skipped++;
            continue;
          }

          const packageId = ledgerEntry.package_id;

          // Fetch current package state
          const { data: pkg, error: pkgError } = await supabaseClient
            .from('package')
            .select('consumed_sessions, on_hold_sessions, total_sessions')
            .eq('package_id', packageId)
            .single();

          if (pkgError || !pkg) {
            console.error(`[auto-complete-events] Package not found: ${packageId}`);
            errors++;
            continue;
          }

          // Validate: must have hold to release
          if (pkg.on_hold_sessions <= 0) {
            console.error(`[auto-complete-events] No hold to release for package ${packageId}`);
            errors++;
            continue;
          }

          // Check idempotency: verify CONSUME entry doesn't already exist
          const { data: existingConsume } = await supabaseClient
            .from('package_ledger')
            .select('ledger_id')
            .eq('package_id', packageId)
            .eq('calendar_event_id', event.id)
            .eq('type', 'CONSUME')
            .maybeSingle();

          if (existingConsume) {
            console.log(`[auto-complete-events] Event ${event.id} already completed, skipping`);
            skipped++;
            continue;
          }

          // Calculate new values
          const newConsumed = pkg.consumed_sessions + 1;
          const newOnHold = pkg.on_hold_sessions - 1;

          // Validate new state
          const available = pkg.total_sessions - newConsumed - newOnHold;
          if (available < 0 || newConsumed < 0 || newOnHold < 0) {
            console.error(`[auto-complete-events] Invalid state for package ${packageId}`);
            errors++;
            continue;
          }

          // Create ledger entry (CONSUME + HOLD_RELEASE)
          const { error: ledgerError } = await supabaseClient
            .from('package_ledger')
            .insert({
              package_id: packageId,
              type: 'CONSUME',
              reason: 'COMPLETE',
              delta_consumed: 1,
              delta_hold: -1,
              calendar_event_id: event.id,
              note: 'Evento completato automaticamente',
              created_by: null, // System action
            });

          if (ledgerError) {
            console.error(`[auto-complete-events] Ledger insert error:`, ledgerError);
            errors++;
            continue;
          }

          // Update package counters
          const { error: updateError } = await supabaseClient
            .from('package')
            .update({
              consumed_sessions: newConsumed,
              on_hold_sessions: newOnHold,
            })
            .eq('package_id', packageId);

          if (updateError) {
            console.error(`[auto-complete-events] Package update error:`, updateError);
            errors++;
            continue;
          }

          // Update event status to 'done'
          const { error: eventUpdateError } = await supabaseClient
            .from('events')
            .update({ session_status: 'done' })
            .eq('id', event.id);

          if (eventUpdateError) {
            console.error(`[auto-complete-events] Event update error:`, eventUpdateError);
            errors++;
            continue;
          }

          console.log(`[auto-complete-events] Successfully completed event ${event.id}`);
          completed++;

        } catch (error) {
          console.error(`[auto-complete-events] Failed to complete event ${event.id}:`, error);
          errors++;
        }
      }
    }

    const result = {
      completed,
      skipped,
      errors,
      total: pastEvents?.length || 0,
      message: `Auto-completed ${completed} events, skipped ${skipped}, errors ${errors}`,
      timestamp: new Date().toISOString()
    };

    console.log("[auto-complete-events] Job completed", result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error("[auto-complete-events] Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
