interface ExerciseTableHeaderProps {
  visible: boolean;
}

export const ExerciseTableHeader = ({ visible }: ExerciseTableHeaderProps) => {
  if (!visible) return null;

  return (
    <div className="hidden sm:grid sm:grid-cols-[32px_minmax(360px,1.6fr)_64px_88px_140px_72px_minmax(110px,0.7fr)_minmax(110px,0.7fr)_40px] items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/60 border-b border-border/15">
      <span></span> {/* Drag handle */}
      <span className="pl-1 text-left">Esercizio</span>
      <span className="pl-1 text-left">Serie</span>
      <span className="pl-1 text-left">Rip</span>
      <span className="pl-1 text-left">Carico</span>
      <span className="pl-1 text-left">Rec</span>
      <span className="pl-1 text-left">Obiettivo</span>
      <span className="pl-1 text-left">Note</span>
      <span></span> {/* Actions */}
    </div>
  );
};
