import { useMutation } from "@tanstack/react-query";
import { getSignedUrl } from "../api/media.api";

/**
 * Extracts the file path from a file URL or returns the path if already relative
 * Handles both new format (relative paths) and old format (full URLs)
 */
function extractFilePath(fileUrl: string): string {
  // If it's already a relative path, use it
  if (!fileUrl.startsWith('http')) return fileUrl;
  
  // Extract from full URL
  // e.g., "https://xxx.supabase.co/storage/v1/object/public/media_library/user-id/file.pdf"
  // → "user-id/file.pdf"
  const urlParts = fileUrl.split('/');
  return urlParts.slice(-2).join('/');
}

export function useSignedUrl() {
  return useMutation({
    mutationFn: async (fileUrl: string) => {
      const filePath = extractFilePath(fileUrl);
      return getSignedUrl(filePath);
    }
  });
}
