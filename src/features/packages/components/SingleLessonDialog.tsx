import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Loader2 } from "lucide-react";

interface SingleLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onConfirmSingleLesson: () => void;
  onConfirmWithoutPackage: () => void;
  isLoading?: boolean;
}

export function SingleLessonDialog({
  open,
  onOpenChange,
  clientName,
  onConfirmSingleLesson,
  onConfirmWithoutPackage,
  isLoading
}: SingleLessonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Il cliente non ha pacchetti attivi
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              <strong>{clientName}</strong> non ha pacchetti con crediti disponibili.
              <br /><br />
              Vuoi creare una lezione singola per questo appuntamento?
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Annulla
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onConfirmWithoutPackage}
            disabled={isLoading}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Conferma senza pacchetto
          </Button>
          <Button
            onClick={onConfirmSingleLesson}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Crea lezione singola
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
