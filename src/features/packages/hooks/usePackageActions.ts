import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  archivePackage, 
  togglePackageSuspension, 
  duplicatePackage 
} from "../api/packages.api";
import { toast } from "sonner";

export function useArchivePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archivePackage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Pacchetto archiviato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}

export function useToggleSuspension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePackageSuspension,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      const action = data.usage_status === 'suspended' ? 'sospeso' : 'riattivato';
      toast.success(`Pacchetto ${action}`);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}

export function useDuplicatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicatePackage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Pacchetto duplicato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}
