import { supabase } from "@/integrations/supabase/client";
import type { LibraryMedia, UploadMediaInput, MediaFilters } from "../types";

export async function getMedia(filters?: MediaFilters): Promise<LibraryMedia[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("library_media")
    .select("*")
    .eq("coach_id", user.id);

  if (filters?.fileType) {
    query = query.eq("file_type", filters.fileType);
  }

  if (filters?.search) {
    query = query.or(`filename.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
  }

  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;
  if (error) throw error;
  return data as LibraryMedia[];
}

export async function uploadMedia(input: UploadMediaInput): Promise<LibraryMedia> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = input.file.name.split('.').pop();
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("media_library")
    .upload(fileName, input.file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("media_library")
    .getPublicUrl(fileName);

  // Determine file type
  const mimeType = input.file.type;
  let fileType: 'video' | 'image' | 'document' = 'document';
  if (mimeType.startsWith('video/')) fileType = 'video';
  else if (mimeType.startsWith('image/')) fileType = 'image';

  // Insert metadata
  const { data, error } = await supabase
    .from("library_media")
    .insert({
      coach_id: user.id,
      filename: input.file.name,
      file_type: fileType,
      file_url: publicUrl,
      file_size_bytes: input.file.size,
      mime_type: mimeType,
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as LibraryMedia;
}

export async function deleteMedia(id: string): Promise<void> {
  const { data: media, error: fetchError } = await supabase
    .from("library_media")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Extract file path from URL
  const urlParts = media.file_url.split('/');
  const filePath = urlParts.slice(-2).join('/');

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("media_library")
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete metadata
  const { error } = await supabase
    .from("library_media")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
