import { generateObject } from 'npm:ai';
import { createOpenAI } from 'npm:@ai-sdk/openai';
import { createAnthropic } from 'npm:@ai-sdk/anthropic';
import { z } from 'npm:zod';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Base64 helper for Deno
function decodeBase64(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, mimeType, modelProvider = "openrouter" } = await req.json();

    if (!fileContent || !mimeType) {
      return new Response(
        JSON.stringify({ error: "fileContent and mimeType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Vercel AI SDK Client dynamically based on env and choice
    // Requested by user: Priority to OpenRouter and OpenAI
    let model;
    
    if (modelProvider === "openrouter" || (!Deno.env.get("OPENAI_API_KEY") && Deno.env.get("OPENROUTER_API_KEY"))) {
      const openRouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: Deno.env.get("OPENROUTER_API_KEY"),
        compatibility: 'compatible', // needed for openrouter with standard OpenAI client
      });
      // Utilizziamo i modelli top di gamma 2026 tramite hub OpenRouter
      // In base alle tue indicazioni, potremmo usare 'google/gemini-3.1-pro' o 'anthropic/claude-3.7-sonnet' (o 4.6 se disponibile)
      model = openRouter('anthropic/claude-3.7-sonnet');
    } else if (modelProvider === "openai" || Deno.env.get("OPENAI_API_KEY")) {
      const openai = createOpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
      // Attualmente o1 o gpt-4.5 (vision) sono le scelte ottimali in ambiente OpenAI puro
      model = openai('gpt-4o'); 
    } else if (Deno.env.get("ANTHROPIC_API_KEY")) {
      const anthropic = createAnthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
      model = anthropic('claude-3-7-sonnet-20250219');
    } else {
      throw new Error("Nessun provider configurato. Inserisci OPENROUTER_API_KEY o OPENAI_API_KEY nei secret di Supabase.");
    }

    const systemPrompt = `Sei un esperto AI per Personal Trainer. Il tuo compito è leggere il documento allegato (che può essere una foto, un PDF o uno screenshot di una scheda d'allenamento di palestra) ed estrarre il piano di allenamento strutturato.
    
Devi analizzare ed identificare correttamente:
- I giorni di allenamento.
- Le Fasi (Riscaldamento, Allenamento Principale, Defaticamento/Stretching). Il 90% degli esercizi andrà in 'Main Workout'.
- I raggruppamenti. Se gli esercizi sono in Superset (spesso indicati da SS, accoppiati da graffe o con la stessa lettera iniziale A1/A2), inseriscili nello stesso ExerciseGroup di tipo 'superset'. Questo è CRITICO.
- Estrai serie, ripetizioni (possono essere stringhe come "Max", "CED") e note sulle tecniche di intensità.`;

    const planSchema = z.object({
      days: z.array(z.object({
        title: z.string().describe("Nome del giorno introdotto nel file, es. 'Giorno 1 - Petto e Tricipiti'"),
        phases: z.array(z.object({
          type: z.enum(["Warm-up", "Main Workout", "Stretching"]).describe("Tipo di blocco. Se non specificato diversamente, tutti gli esercizi pesistici sono 'Main Workout'."),
          groups: z.array(z.object({
            type: z.enum(["single", "superset", "circuit"]).describe("Se è un singolo esercizio usa 'single'. Se ci sono esercizi collegati/in serie usa 'superset'. Se è indicato un vero circuito a tempo/giri usa 'circuit'."),
            name: z.string().describe("Nome eventuale del gruppo o circuito. Vuoto se è single.").optional(),
            rounds: z.number().describe("Solo per i circuiti. Saltalo altrimenti.").optional(),
            exercises: z.array(z.object({
              name: z.string().describe("Nome completo dell'esercizio. Pulisci il nome da numerazioni inutili."),
              sets: z.number().describe("Numero di serie. Usa 0 se non applicabile."),
              reps: z.string().describe("Ripetizioni. Lasciale come stringa se vedi range o testi particolari (es. 'CED', '10-12', 'Max')."),
              rest: z.string().describe("Tempo di recupero (es. '60s', '1m30s').").optional(),
              notes: z.string().describe("Tieni traccia delle note o delle tecniche d'intensità qui (es. Drop set).").optional(),
            })).min(1)
          })).min(1)
        })).min(1)
      })).min(1)
    });

    const uint8FileContent = decodeBase64(fileContent);

    // Build the content part based on MIME type: images use `image`, PDFs/docs use `file`
    const filePart = mimeType === 'application/pdf'
      ? { type: 'file' as const, data: uint8FileContent, mimeType: mimeType }
      : { type: 'image' as const, image: uint8FileContent, mimeType: mimeType };

    const { object } = await generateObject({
      model,
      schema: planSchema,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Per favore, decodifica esattamente questa scheda e restituisci la struttura Zod attesa.' },
            filePart,
          ],
        },
      ],
      temperature: 0.1,
    });

    // Hydrate the AI output with `id` and `order` fields required by our Plan types.
    // The AI schema intentionally omits these (the model can't generate valid UUIDs),
    // so we inject them deterministically here before sending to the client.
    const hydratedDays = object.days.map((day: any, dIdx: number) => ({
      ...day,
      id: crypto.randomUUID(),
      order: dIdx + 1,
      phases: day.phases.map((phase: any) => ({
        ...phase,
        id: crypto.randomUUID(),
        groups: phase.groups.map((group: any, gIdx: number) => ({
          ...group,
          id: crypto.randomUUID(),
          order: gIdx + 1,
          exercises: group.exercises.map((ex: any, eIdx: number) => ({
            ...ex,
            id: crypto.randomUUID(),
            order: eIdx + 1,
          })),
        })),
      })),
    }));

    return new Response(JSON.stringify({ days: hydratedDays }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("parse-training-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
