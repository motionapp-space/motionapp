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

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // System prompt specializzato per Personal Trainer
    const systemPrompt = `Sei un assistente AI specializzato per Personal Trainer professionisti.

Il tuo compito è aiutare i PT a creare e ottimizzare programmi di allenamento personalizzati.

Regole di comportamento:
- Rispondi SEMPRE in italiano
- Sii conciso ma completo
- Fornisci suggerimenti pratici e applicabili
- Quando suggerisci esercizi, specifica serie, ripetizioni e recuperi
- Adatta le risposte al contesto del piano di allenamento corrente

Contesto piano corrente:
${context ? JSON.stringify(context, null, 2) : "Nessun piano attivo"}

Quando l'utente chiede suggerimenti, rispondi con un JSON structured output seguendo questo schema:
{
  "type": "suggestion",
  "summary": "Titolo del suggerimento",
  "preview": ["Punto 1", "Punto 2", "Punto 3"],
  "patch": [
    {
      "op": "add",
      "target": { "dayId": "...", "phaseType": "..." },
      "data": { "name": "...", "sets": 3, "reps": "12", "rest": "60s" }
    }
  ]
}

Quando rispondi a domande generali, usa:
{
  "type": "text",
  "content": "La tua risposta in italiano"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite richieste superato. Riprova tra un minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore servizio AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Copilot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
