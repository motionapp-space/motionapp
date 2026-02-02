import { useState } from "react";
import { addDays } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateInviteCode } from "../utils/generateInviteCode";
import { useCreateCoachInvite } from "../hooks/useCoachInvites";

export function CreateInviteDialog() {
  const [open, setOpen] = useState(false);
  const createInvite = useCreateCoachInvite();

  const handleCreate = async () => {
    const code = generateInviteCode();
    const expiresAt = addDays(new Date(), 7).toISOString();

    await createInvite.mutateAsync({
      code,
      expires_at: expiresAt,
      max_uses: 1,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Crea invito coach
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea nuovo invito coach</DialogTitle>
          <DialogDescription>
            Verrà generato un codice unico con validità di 7 giorni.
            L'invito può essere utilizzato una sola volta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleCreate} disabled={createInvite.isPending}>
            {createInvite.isPending ? "Creazione..." : "Crea invito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
