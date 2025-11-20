import { FLAGS } from "@/flags";
import { CopilotResponse, isCopilotResponse } from "./schema";
import { supabase } from "@/integrations/supabase/client";

let lastCalls: number[] = [];

function rateLimitOk() {
  const now = Date.now();
  lastCalls = lastCalls.filter(t => now - t < 60_000);
  return lastCalls.length < FLAGS.copilotRateLimitPerMin;
}

export async function sendCopilot(
  payload: any,
  onDelta?: (chunk: string) => void
): Promise<CopilotResponse["payload"]> {
  if (!rateLimitOk()) {
    throw new Error("Troppe richieste. Attendi un minuto.");
  }
  lastCalls.push(Date.now());

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot`;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    if (resp.status === 429) {
      throw new Error("Limite richieste superato. Attendi un minuto.");
    }
    if (resp.status === 402) {
      throw new Error("Crediti AI esauriti. Contatta l'amministratore.");
    }
    const errorText = await resp.text();
    throw new Error(`Errore AI: ${errorText}`);
  }

  if (!onDelta || !resp.body) {
    // Non-streaming fallback
    const data = await resp.json();
    if (!isCopilotResponse(data)) throw new Error("Risposta non valida");
    return data.payload;
  }

  // Streaming response
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, re-buffer
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Return text response
    return {
      type: "text",
      content: fullContent,
    };
  } catch (e) {
    console.error("Streaming error:", e);
    throw new Error("Errore durante la risposta AI");
  }
}
