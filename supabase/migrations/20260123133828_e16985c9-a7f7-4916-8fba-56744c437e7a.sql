-- Modifica la funzione cancel_series_with_ledger per supportare cancellazione "solo futuri"
-- Aggiunge p_only_future (default true) che filtra per start_at >= p_now

CREATE OR REPLACE FUNCTION cancel_series_with_ledger(
  p_series_id uuid,
  p_actor text,
  p_now timestamptz DEFAULT now(),
  p_only_future boolean DEFAULT true  -- NUOVO parametro: default cancella solo futuri
) RETURNS jsonb AS $$
DECLARE
  v_event_id uuid;
  v_event_ids uuid[];
  v_results jsonb[] := '{}';
  v_result jsonb;
  v_count int := 0;
  v_errors int := 0;
  v_coach_client_id uuid;
BEGIN
  -- Selezione con filtro temporale condizionale
  SELECT array_agg(id ORDER BY start_at), MIN(coach_client_id) 
  INTO v_event_ids, v_coach_client_id
  FROM events 
  WHERE series_id = p_series_id 
    AND session_status NOT IN ('canceled', 'done')
    AND (NOT p_only_future OR start_at >= p_now)  -- NUOVA condizione: filtra per data se p_only_future
  FOR UPDATE;
  
  IF v_event_ids IS NULL OR array_length(v_event_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'series_id', p_series_id, 
      'canceled_count', 0, 
      'message', 'No cancellable events in series'
    );
  END IF;

  IF p_actor = 'coach' THEN
    PERFORM check_coach_owns_coach_client(v_coach_client_id);
  ELSIF p_actor = 'client' THEN
    PERFORM check_client_owns_coach_client(v_coach_client_id);
  ELSE
    RAISE EXCEPTION 'Invalid actor';
  END IF;

  FOREACH v_event_id IN ARRAY v_event_ids
  LOOP
    BEGIN
      v_result := cancel_event_with_ledger(v_event_id, p_actor, p_now);
      v_results := array_append(v_results, v_result);
      IF (v_result->>'canceled')::boolean IS TRUE OR (v_result->>'already_canceled')::boolean IS TRUE THEN
        v_count := v_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_results := array_append(v_results, jsonb_build_object(
        'event_id', v_event_id,
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'series_id', p_series_id,
    'canceled_count', v_count,
    'errors_count', v_errors,
    'total_events', array_length(v_event_ids, 1),
    'results', to_jsonb(v_results)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;