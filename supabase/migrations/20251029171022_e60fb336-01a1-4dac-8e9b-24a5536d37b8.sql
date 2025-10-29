-- Add missing foreign key constraint for training_sessions -> clients
ALTER TABLE public.training_sessions
ADD CONSTRAINT training_sessions_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.clients(id)
ON DELETE CASCADE;