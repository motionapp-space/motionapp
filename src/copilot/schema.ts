export type TextResponse = { type: "text"; content: string };

export type SuggestionResponse = {
  type: "suggestion";
  summary: string;
  patch: Array<PatchOp>;
  preview?: string[];
};

export type CopilotResponse = { payload: TextResponse | SuggestionResponse };

export type PatchOp =
  | { op: "add"; target: { dayId: string; phaseType: string }; data: ExercisePartial }
  | { op: "update"; target: { exerciseId: string }; data: ExercisePartial }
  | { op: "delete"; target: { exerciseId: string } };

export type ExercisePartial = {
  name?: string;
  sets?: number;
  reps?: string;
  load?: string;
  rest?: string;
  notes?: string;
  goal?: string;
  order?: number | "auto";
};

export function isSuggestionResponse(x: any): x is SuggestionResponse {
  return x && x.type === "suggestion" && Array.isArray(x.patch);
}

export function isCopilotResponse(x: any): x is CopilotResponse {
  if (!x || typeof x !== "object") return false;
  const p = (x as any).payload;
  return p && (p.type === "text" || isSuggestionResponse(p));
}
