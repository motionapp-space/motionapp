interface ExerciseTableHeaderProps {
  visible: boolean;
}

export const ExerciseTableHeader = ({ visible }: ExerciseTableHeaderProps) => {
  if (!visible) return null;

  return (
    <div className="hidden sm:grid sm:grid-cols-[32px_1fr_60px_60px_70px_60px_40px_40px] items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/20">
      <span></span> {/* Drag handle */}
      <span className="pl-1">Esercizio</span>
      <span className="text-center">Serie</span>
      <span className="text-center">Rip</span>
      <span className="text-center">Carico</span>
      <span className="text-center">Rec</span>
      <span></span> {/* Note icon */}
      <span></span> {/* Actions */}
    </div>
  );
};
