import { FLAGS } from "@/flags";
import { CopilotResponse, isCopilotResponse } from "./schema";
import { supabase } from "@/integrations/supabase/client";

let lastCalls: number[] = [];

function rateLimitOk() {
  const now = Date.now();
  lastCalls = lastCalls.filter(t => now - t < 60_000);
  return lastCalls.length < FLAGS.copilotRateLimitPerMin;
}

export async function sendCopilot(payload: any): Promise<CopilotResponse["payload"]> {
  if (!rateLimitOk()) {
    throw new Error("Troppe richieste. Attendi un minuto.");
  }
  lastCalls.push(Date.now());

  const doFetch = async (attempt: number) => {
    const { data, error } = await supabase.functions.invoke("copilot", {
      body: payload,
    });

    if (error) throw new Error(`Errore: ${error.message}`);
    if (!isCopilotResponse(data)) throw new Error("Risposta non valida");
    return data.payload;
  };

  try {
    return await doFetch(1);
  } catch (e) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    return await doFetch(2);
  }
}
