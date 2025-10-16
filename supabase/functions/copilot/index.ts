import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    if (!Array.isArray(messages) || !context) {
      return new Response(
        JSON.stringify({ error: "Bad request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mock response for MVP - replace with actual AI call
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // Simple keyword detection for demo
    if (lastUserMessage.toLowerCase().includes("suggerisci") || 
        lastUserMessage.toLowerCase().includes("proponi")) {
      return new Response(
        JSON.stringify({
          payload: {
            type: "suggestion",
            summary: "Esempio di suggerimento AI",
            preview: [
              "Aggiungi riscaldamento articolare 5 minuti",
              "Riduci recuperi a 90 secondi per migliorare densità"
            ],
            patch: [
              {
                op: "add",
                target: {
                  dayId: context?.plan?.days?.[0]?.id || "",
                  phaseType: "Warm-up"
                },
                data: {
                  name: "Riscaldamento articolare",
                  sets: 1,
                  reps: "5 min",
                  order: "auto"
                }
              }
            ]
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default text response
    return new Response(
      JSON.stringify({
        payload: {
          type: "text",
          content: "Ciao! Sono il Copilot AI di PlanPal. Come posso aiutarti a migliorare il tuo piano di allenamento?"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Copilot error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
