export type MediaFileType = 'video' | 'image' | 'document';

export interface LibraryMedia {
  id: string;
  coach_id: string;
  filename: string;
  file_type: MediaFileType;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UploadMediaInput {
  file: File;
  tags?: string[];
}

export interface MediaFilters {
  search?: string;
  fileType?: MediaFileType;
  sortBy?: 'created_at' | 'filename';
  sortOrder?: 'asc' | 'desc';
}
