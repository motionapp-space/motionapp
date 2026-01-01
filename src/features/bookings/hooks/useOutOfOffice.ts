import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOutOfOfficeBlocks,
  createOutOfOfficeBlock,
  updateOutOfOfficeBlock,
  deleteOutOfOfficeBlock,
} from "../api/out-of-office.api";
import type { CreateOutOfOfficeBlockInput, UpdateOutOfOfficeBlockInput } from "../types";

export function useOutOfOfficeBlocksQuery() {
  return useQuery({
    queryKey: ["out-of-office-blocks"],
    queryFn: listOutOfOfficeBlocks,
  });
}

export function useCreateOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOutOfOfficeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
    },
  });
}

export function useUpdateOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOutOfOfficeBlockInput }) =>
      updateOutOfOfficeBlock(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
    },
  });
}

export function useDeleteOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOutOfOfficeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
    },
  });
}
