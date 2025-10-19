-- Add foreign key constraint from events to clients
ALTER TABLE public.events
  ADD CONSTRAINT events_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;