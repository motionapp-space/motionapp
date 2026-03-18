import { generateObject } from 'npm:ai';
import { createOpenAI } from 'npm:@ai-sdk/openai';
import { createAnthropic } from 'npm:@ai-sdk/anthropic';
import { z } from 'npm:zod';
import * as XLSX from 'npm:xlsx';

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

// MIME types that are spreadsheets (need text extraction, not vision)
const SPREADSHEET_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
];

// Convert a spreadsheet binary to a text representation of all sheets
function spreadsheetToText(data: Uint8Array): string {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      sheets.push(`=== Foglio: ${sheetName} ===\n${csv}`);
    }
  }

  return sheets.join('\n\n');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, mimeType, modelProvider = "auto" } = await req.json();

    if (!fileContent || !mimeType) {
      return new Response(
        JSON.stringify({ error: "fileContent and mimeType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-detect the best available provider based on configured secrets.
    let model;
    const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
    const hasOpenRouter = !!Deno.env.get("OPENROUTER_API_KEY");
    const hasAnthropic = !!Deno.env.get("ANTHROPIC_API_KEY");

    const resolvedProvider =
      modelProvider !== "auto" ? modelProvider
      : hasOpenAI ? "openai"
      : hasOpenRouter ? "openrouter"
      : hasAnthropic ? "anthropic"
      : null;

    if (resolvedProvider === "openrouter" && hasOpenRouter) {
      const openRouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: Deno.env.get("OPENROUTER_API_KEY"),
        compatibility: 'compatible',
      });
      model = openRouter('anthropic/claude-3.7-sonnet');
    } else if (resolvedProvider === "openai" && hasOpenAI) {
      const openai = createOpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
      model = openai('gpt-4o');
    } else if (resolvedProvider === "anthropic" && hasAnthropic) {
      const anthropic = createAnthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
      model = anthropic('claude-3-7-sonnet-20250219');
    } else {
      if (hasOpenAI) {
        const openai = createOpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
        model = openai('gpt-4o');
      } else if (hasOpenRouter) {
        const openRouter = createOpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: Deno.env.get("OPENROUTER_API_KEY"),
          compatibility: 'compatible',
        });
        model = openRouter('anthropic/claude-3.7-sonnet');
      } else if (hasAnthropic) {
        const anthropic = createAnthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
        model = anthropic('claude-3-7-sonnet-20250219');
      } else {
        throw new Error("Nessun provider configurato. Inserisci OPENAI_API_KEY o OPENROUTER_API_KEY nei secret di Supabase.");
      }
    }

    const systemPrompt = `Sei un esperto AI per Personal Trainer. Il tuo compito è leggere il documento allegato (che può essere una foto, un PDF, un foglio Excel CSV o uno screenshot di una scheda d'allenamento di palestra) ed estrarre il piano di allenamento strutturato.
    
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
            name: z.string().describe("Nome del gruppo o circuito. Stringa vuota '' se è single."),
            rounds: z.number().describe("Solo per i circuiti, numero di giri. Usa 0 se non applicabile."),
            exercises: z.array(z.object({
              name: z.string().describe("Nome completo dell'esercizio. Pulisci il nome da numerazioni inutili."),
              sets: z.number().describe("Numero di serie. Usa 0 se non applicabile."),
              reps: z.string().describe("Ripetizioni. Lasciale come stringa se vedi range o testi particolari (es. 'CED', '10-12', 'Max')."),
              rest: z.string().describe("Tempo di recupero (es. '60s', '1m30s'). Stringa vuota '' se non indicato."),
              notes: z.string().describe("Note o tecniche d'intensità (es. Drop set). Stringa vuota '' se assente."),
            })).min(1)
          })).min(1)
        })).min(1)
      })).min(1)
    });

    const uint8FileContent = decodeBase64(fileContent);
    const isSpreadsheet = SPREADSHEET_MIMES.includes(mimeType);

    // Build the user message content based on file type
    let userContent: any[];

    if (isSpreadsheet) {
      // Spreadsheets: parse to text first, then send as text-only (no vision needed)
      const textContent = spreadsheetToText(uint8FileContent);
      userContent = [
        { type: 'text', text: `Per favore, analizza questo foglio Excel esportato in formato testo e restituisci la struttura Zod attesa.\n\n${textContent}` },
      ];
    } else if (mimeType === 'application/pdf') {
      // PDFs: use file attachment
      userContent = [
        { type: 'text', text: 'Per favore, decodifica esattamente questa scheda e restituisci la struttura Zod attesa.' },
        { type: 'file' as const, data: uint8FileContent, mimeType: mimeType },
      ];
    } else {
      // Images: use image attachment
      userContent = [
        { type: 'text', text: 'Per favore, decodifica esattamente questa scheda e restituisci la struttura Zod attesa.' },
        { type: 'image' as const, image: uint8FileContent, mimeType: mimeType },
      ];
    }

    const { object } = await generateObject({
      model,
      schema: planSchema,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
    });

    // Hydrate the AI output with `id` and `order` fields required by our Plan types.
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
