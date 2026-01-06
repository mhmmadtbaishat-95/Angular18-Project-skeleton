/**
 * Document type from API
 */
export interface IDocumentType {
  id: string;
  name: string;
  nameAr: string;
  required: boolean;
  description?: string;
  descriptionAr?: string;
  allowedFormats?: string[]; // e.g., ['pdf', 'jpg', 'png']
  maxSize?: number; // in bytes
}

/**
 * Uploaded document with metadata
 */
export interface IUploadedDocument {
  id: string; // Unique ID for this upload
  documentTypeId: string;
  documentTypeName: string;
  file: File;
  uploadedAt: Date;
  uploadProgress?: number;
  uploadError?: string;
}

/**
 * API response for document types
 */
export interface IDocumentTypesResponse {
  documentTypes: IDocumentType[];
}

