/**
 * Hook for calendar-package integration
 * Handles automatic credit management when events change status
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  handleEventConfirm, 
  handleEventComplete, 
  handleEventCancel,
  findPackageForEvent 
} from "../api/calendar-integration.api";
import { toast } from "sonner";

/**
 * Confirm event and create hold on package
 */
export function useConfirmEventWithPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      clientId, 
      startAt 
    }: { 
      eventId: string; 
      clientId: string; 
      startAt: string;
    }) => {
      return await handleEventConfirm(eventId, clientId, startAt);
    },
    
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", result.package.package_id] });
      queryClient.invalidateQueries({ queryKey: ["package-ledger", result.package.package_id] });
      
      if (result.package.is_single_technical) {
        toast.success("Pacchetto automatico creato", {
          description: "Creato pacchetto da 1 sessione per questo appuntamento",
        });
      } else {
        toast.success("Sessione prenotata", {
          description: `1 credito messo in attesa`,
        });
      }
    },
    
    onError: (error: Error) => {
      toast.error("Errore nella prenotazione", {
        description: error.message,
      });
    },
  });
}

/**
 * Complete event and consume credit
 */
export function useCompleteEventWithPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      packageId 
    }: { 
      eventId: string;
      packageId?: string;
    }) => {
      // Find package if not provided
      const pkgId = packageId || await findPackageForEvent(eventId);
      if (!pkgId) {
        throw new Error("Nessun pacchetto trovato per questo evento");
      }
      return await handleEventComplete(eventId, pkgId);
    },
    
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", pkg.package_id] });
      queryClient.invalidateQueries({ queryKey: ["package-ledger", pkg.package_id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      toast.success("Sessione completata", {
        description: "1 credito consumato",
      });
    },
    
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}

/**
 * Cancel event and handle credit (release or consume based on timing)
 */
export function useCancelEventWithPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      packageId,
      startAt 
    }: { 
      eventId: string;
      packageId?: string;
      startAt: string;
    }) => {
      // Find package if not provided
      const pkgId = packageId || await findPackageForEvent(eventId);
      if (!pkgId) {
        throw new Error("Nessun pacchetto trovato per questo evento");
      }
      return await handleEventCancel(eventId, pkgId, startAt);
    },
    
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", result.package.package_id] });
      queryClient.invalidateQueries({ queryKey: ["package-ledger", result.package.package_id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      if (result.penaltyApplied) {
        toast.warning("Cancellazione tardiva", {
          description: "1 credito consumato (cancellazione entro finestra)",
        });
      } else {
        toast.success("Appuntamento cancellato", {
          description: "Credito rilasciato",
        });
      }
    },
    
    onError: (error: Error) => {
      toast.error("Errore nella cancellazione", {
        description: error.message,
      });
    },
  });
}
