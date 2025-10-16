import { useEffect, useRef, useState } from "react";
import { FLAGS } from "@/flags";
import { buildPlanContext } from "@/copilot/context";
import { sendCopilot } from "@/copilot/client";
import { isSuggestionResponse } from "@/copilot/schema";
import { applySuggestion } from "@/copilot/patcher";
import { track } from "@/copilot/telemetry";
import { usePlanStore } from "@/stores/usePlanStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  const { plan, save } = usePlanStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: any }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) track("copilot.opened");
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo(0, scroller.current.scrollHeight);
  }, [messages]);

  if (!open) return null;

  const onSend = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    const userMsg = { role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    track("copilot.prompt.sent", { chars: input.length });

    try {
      const ctx = buildPlanContext(plan);
      const res = await sendCopilot({ messages: [...messages, userMsg], context: ctx });
      track("copilot.response", { type: res.type });
      const assistantMsg = { role: "assistant" as const, content: res };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e.message || "Si è verificato un errore. Riprova.");
      track("copilot.error", { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const onApply = async (suggestion: any) => {
    try {
      applySuggestion(suggestion.patch);
      track("copilot.apply", { ops: suggestion.patch.length });
      
      if (FLAGS.copilotAutosaveOnApply) {
        await save();
      }
      
      toast({
        title: "Suggerimento applicato",
        description: "Le modifiche sono state applicate al piano.",
      });
    } catch (e: any) {
      toast({
        title: "Errore",
        description: "Impossibile applicare il suggerimento.",
        variant: "destructive",
      });
    }
  };

  const quickPrompts = [
    "Suggerisci un giorno full body",
    "Proponi una progressione per squat",
    "Ottimizza i recuperi dove sensato",
    "Idee di riscaldamento per spalle"
  ];

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Copilot AI"
      className="fixed inset-y-0 right-0 w-full sm:w-[420px] lg:w-[480px] bg-background shadow-lg border-l flex flex-col z-50"
    >
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Copilot AI</div>
          <div className="text-sm text-muted-foreground">Suggerimenti contestuali</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11"
          aria-label="Chiudi Copilot"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div ref={scroller} className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3 text-sm">
            <div className="font-medium">Chiedi al Copilot</div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map(s => (
                <button
                  key={s}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} m={m} onApply={onApply} />
        ))}

        {loading && <div className="text-sm text-muted-foreground">AI sta scrivendo…</div>}
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      <footer className="px-6 py-4 border-t">
        <label className="sr-only" htmlFor="copilot-input">
          Messaggio per il Copilot
        </label>
        <textarea
          id="copilot-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={2}
          className="w-full rounded-md border p-3 resize-none"
          placeholder="Chiedi qualcosa al Copilot…"
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="mt-3 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
          <Button onClick={onSend} disabled={loading || !input.trim()}>
            Invia
          </Button>
        </div>
      </footer>
    </aside>
  );
}

function Message({ m, onApply }: { m: { role: "user" | "assistant"; content: any }; onApply: (s: any) => void }) {
  const isSuggestion = isSuggestionResponse(m.content);

  return (
    <div className={`max-w-[600px] ${m.role === "user" ? "ml-auto" : ""}`}>
      {isSuggestion ? (
        <div className="rounded-lg border shadow-sm p-4 space-y-2">
          <div className="font-medium">{m.content.summary}</div>
          {Array.isArray(m.content.preview) && m.content.preview.length > 0 && (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {m.content.preview.slice(0, 5).map((p: string, idx: number) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button onClick={() => onApply(m.content)}>
              Applica suggerimento
            </Button>
            <Button variant="outline">Ignora</Button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-lg ${
            m.role === "assistant" ? "bg-muted/30" : "bg-primary/10"
          } p-3 text-sm`}
        >
          {typeof m.content === "string" ? m.content : m.content?.content || JSON.stringify(m.content)}
        </div>
      )}
    </div>
  );
}
