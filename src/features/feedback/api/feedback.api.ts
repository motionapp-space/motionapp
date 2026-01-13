import { supabase } from "@/integrations/supabase/client";

export type FeedbackType = 'bug' | 'suggestion' | 'other';

interface CreateFeedbackInput {
  type: FeedbackType;
  section: string;
  message: string;
  page: string;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      user_email: user.email!,
      type: input.type,
      message: input.message,
      page: input.page,
      status: 'new'
    });

  if (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
}
