import File from '../../database/models/File';
import thumbnailService from '../../services/thumbnail.service';

export default class FileResponseDto {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  uploaded_by: number;
  thumbnail_path?: string;
  supports_preview: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(file: File) {
    this.id = file.id;
    this.filename = file.filename;
    this.original_name = file.original_name;
    this.mime_type = file.mime_type;
    this.size = file.size;
    this.storage_path = file.storage_path;
    this.uploaded_by = file.uploaded_by;
    this.thumbnail_path = file.thumbnail_path;
    this.supports_preview = thumbnailService.supportsPreview(file.mime_type);
    this.created_at = (file as any).createdAt || (file as any).created_at;
    this.updated_at = (file as any).updatedAt || (file as any).updated_at;
  }

  static make(file: File): FileResponseDto {
    return new FileResponseDto(file);
  }

  static makeMany(files: File[]): FileResponseDto[] {
    return files.map((file) => FileResponseDto.make(file));
  }
}

