-- =====================================================
-- STEP 0: Schema DB Conversazioni AI
-- Tabelle: ai_conversations, ai_messages, ai_actions_log
-- Include: RLS policies, indici, trigger updated_at
-- =====================================================

-- Tabella: ai_conversations
-- Memorizza le conversazioni tra coach e AI
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context_page TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella: ai_messages
-- Memorizza i singoli messaggi di una conversazione
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent_type TEXT,
  intent_payload JSONB,
  context_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella: ai_actions_log
-- Log delle azioni eseguite dall'AI
CREATE TABLE public.ai_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'confirmed', 'executed', 'failed', 'cancelled')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indici per performance
CREATE INDEX idx_ai_conversations_coach_id ON public.ai_conversations(coach_id);
CREATE INDEX idx_ai_conversations_last_message ON public.ai_conversations(coach_id, last_message_at DESC);

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(conversation_id, created_at ASC);

CREATE INDEX idx_ai_actions_log_conversation_id ON public.ai_actions_log(conversation_id);
CREATE INDEX idx_ai_actions_log_coach_id ON public.ai_actions_log(coach_id);
CREATE INDEX idx_ai_actions_log_status ON public.ai_actions_log(coach_id, status, created_at DESC);

-- Trigger per updated_at su ai_conversations
CREATE OR REPLACE FUNCTION public.update_ai_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_conversation_updated_at();

-- Trigger per aggiornare last_message_at quando viene aggiunto un messaggio
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions_log ENABLE ROW LEVEL SECURITY;

-- ai_conversations policies
CREATE POLICY "Coaches can view their own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create their own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (coach_id = auth.uid());

-- ai_messages policies
CREATE POLICY "Coaches can view messages from their conversations"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create messages in their conversations"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update messages in their conversations"
  ON public.ai_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete messages in their conversations"
  ON public.ai_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.coach_id = auth.uid()
    )
  );

-- ai_actions_log policies
CREATE POLICY "Coaches can view their own actions log"
  ON public.ai_actions_log
  FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create actions in their log"
  ON public.ai_actions_log
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own actions log"
  ON public.ai_actions_log
  FOR UPDATE
  USING (coach_id = auth.uid());

-- DELETE non permesso per mantenere audit trail completo