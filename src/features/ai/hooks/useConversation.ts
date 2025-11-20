import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getOrCreateConversation,
  loadMessages,
  saveMessage,
  Message,
} from "../api/conversations.api";

export function useConversation(contextPage?: string) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initConversation();
  }, [contextPage]);

  async function initConversation() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      const convId = await getOrCreateConversation(user.id, contextPage);
      setConversationId(convId);

      const msgs = await loadMessages(convId);
      setMessages(msgs);
      setError(null);
    } catch (e: any) {
      console.error("Error initializing conversation:", e);
      setError(e.message || "Errore caricamento conversazione");
    } finally {
      setLoading(false);
    }
  }

  async function addMessage(
    role: "user" | "assistant",
    content: string,
    intentType?: string,
    intentPayload?: any
  ) {
    if (!conversationId) return;

    try {
      await saveMessage(conversationId, role, content, intentType, intentPayload);
      
      // Optimistic update
      const newMsg: Message = {
        id: crypto.randomUUID(),
        role,
        content,
        created_at: new Date().toISOString(),
        intent_type: intentType,
        intent_payload: intentPayload,
      };
      setMessages(prev => [...prev, newMsg]);
    } catch (e: any) {
      console.error("Error saving message:", e);
      throw e;
    }
  }

  async function clearConversation() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      const convId = await getOrCreateConversation(user.id, contextPage);
      setConversationId(convId);
      setMessages([]);
    } catch (e: any) {
      console.error("Error clearing conversation:", e);
      setError(e.message);
    }
  }

  return {
    conversationId,
    messages,
    loading,
    error,
    addMessage,
    clearConversation,
    setMessages,
  };
}
