import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  intent_type?: string;
  intent_payload?: any;
}

export interface Conversation {
  id: string;
  title?: string;
  context_page?: string;
  last_message_at: string;
  created_at: string;
}

export async function getOrCreateConversation(
  coachId: string,
  contextPage?: string
): Promise<string> {
  // Try to get the most recent conversation for this context
  const { data: existing } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("coach_id", coachId)
    .eq("context_page", contextPage || "plan_editor")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("ai_conversations")
    .insert({
      coach_id: coachId,
      context_page: contextPage || "plan_editor",
      title: "Nuova conversazione",
    })
    .select("id")
    .single();

  if (error) throw error;
  return newConv.id;
}

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    created_at: msg.created_at,
    intent_type: msg.intent_type || undefined,
    intent_payload: msg.intent_payload || undefined,
  }));
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  intentType?: string,
  intentPayload?: any
): Promise<void> {
  const { error } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    intent_type: intentType,
    intent_payload: intentPayload,
  });

  if (error) throw error;
}

export async function getConversations(coachId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("coach_id", coachId)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
