import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface LegendBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegendBottomSheet({ open, onOpenChange }: LegendBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-2 mb-3" />
        
        <SheetHeader>
          <SheetTitle className="text-left">Legenda completamento</SheetTitle>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[22px] px-2 text-[12px] rounded-full inline-flex items-center bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              1/3
            </span>
            <span className="text-[14px] text-muted-foreground">Serie incomplete</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="h-[22px] px-2 text-[12px] rounded-full inline-flex items-center bg-success/20 text-foreground dark:text-success">
              3/3
            </span>
            <span className="text-[14px] text-muted-foreground">Serie complete</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="h-[22px] px-2 text-[12px] rounded-full inline-flex items-center bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
              4/3
            </span>
            <span className="text-[14px] text-muted-foreground">Serie extra (oltre il target)</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
