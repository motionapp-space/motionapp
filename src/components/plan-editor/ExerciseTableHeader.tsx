interface ExerciseTableHeaderProps {
  visible: boolean;
}

export const ExerciseTableHeader = ({ visible }: ExerciseTableHeaderProps) => {
  if (!visible) return null;

  return (
    <div className="hidden sm:grid sm:grid-cols-[32px_minmax(240px,1fr)_64px_88px_140px_72px_minmax(140px,1fr)_minmax(140px,1fr)_40px] items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/60 border-b border-border/15">
      <span></span> {/* Drag handle */}
      <span className="pl-1 text-left">Esercizio</span>
      <span className="text-center">Serie</span>
      <span className="text-center">Rip</span>
      <span className="text-center">Carico</span>
      <span className="text-center">Rec</span>
      <span className="text-left pl-1.5">Obiettivo</span>
      <span className="text-left pl-1.5">Note</span>
      <span></span> {/* Actions */}
    </div>
  );
};
