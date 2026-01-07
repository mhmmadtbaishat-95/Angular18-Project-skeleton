/**
 * Developer Information Interface
 * Response from API when fetching current developer info
 */
export interface IDeveloperInfo {
  developerRegistrationNumber: string;
  developerName: string;
  developerType: 'Natural' | 'Legal';
  licenseStatus: 'Active' | 'Expired' | 'Suspended' | 'Pending';
  licenseExpirationDate: string; // ISO date string
}

/**
 * Service Request Submission Payload
 * Data structure for submitting a service request
 */
export interface IServiceRequestPayload {
  // Developer Information (read-only, pre-populated)
  developerRegistrationNumber: string;
  developerName: string;
  developerType: string;
  licenseStatus: string;
  licenseExpirationDate: string;

  // Form A: Project Licenses Request
  projectName: string;
  projectType: string;
  area: string;
  plotNumber: string;
  landArea: string;
  numberOfUnits?: number;
  executionPeriod: number;

  // Form B: Master Plan & Preliminary Design
  planType: string;
  designStage: string;
  numberOfBuildings: number;
  numberOfDevelopmentStages: number;
  approximateHeight: number;

  // Form C: Escrow Account
  isOffPlan: boolean;
  bankName: string;
  estimatedProjectValue: number;

  // Form D: License Application
  numberOfUnitsForSale: number;
  startSaleDate: string; // ISO date string
  expectedDeliveryDate: string; // ISO date string
  downPaymentPercentage: number;

  // Documents metadata
  documents?: Array<{
    name: string;
    size: number;
    type: string;
    index: number;
  }>;

  // Additional metadata
  serviceId?: string;
  requestId?: string;
  submittedAt: string; // ISO date string
}

/**
 * Service Request Submission Response
 * Response from API after submitting a service request
 */
export interface IServiceRequestResponse {
  id: string;
  requestNumber: string;
  status: string;
  submittedAt: string;
  message?: string;
}

/**
 * Document Upload Response
 * Response from API after uploading documents
 */
export interface IDocumentUploadResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

/**
 * Create and Submit Request API Payload
 * Request structure for /Request/CreateAndSubmitRequest endpoint
 */
export interface ICreateAndSubmitRequestPayload {
  RequestGuid: string; // "00000000-0000-0000-0000-000000000000" for new requests
  ProjectName: string;
  ProjectType: number;
  Area: string;
  PlotNumber: string;
  LandArea: string;
  NumberOfUnits: string;
  ExecutionPeriod: string;
  PlanType: number;
  DesignStage: number;
  NumberOfBuildings: string;
  NumberOfDevelopmentStages: string;
  ApproximateHeight: string;
  CouponNumber?: string;
  LandRegistryNumber?: string;
  PropertyType?: number;
  IsTheProjectOffPlanSale: number; // 0 or 1
  BankName: string;
  EstimatedValueOfProject: string;
  NumberOfUnitsForSale: string;
  StartSaleDate: string; // ISO date string
  ExpectedDeliveryDate: string; // ISO date string
  DownPaymentPercentage: string;
  DeveloperComments?: string;
  AqaratComments?: string;
}

/**
 * Request Document from API Response
 */
export interface IRequestDocument {
  DocumentName: string;
  DocumentNameAr?: string; // Arabic document name
  DocumentGuid: string;
  DocumentDescription: string;
  Attachment: string | null;
  pageIndex: number;
  entityName: string | null;
  ProcessTemplateAr?: string; // Arabic process template
}

/**
 * Create and Submit Request API Response
 * Response structure from /Request/CreateAndSubmitRequest endpoint
 */
export interface ICreateAndSubmitRequestResponse {
  RequestNumber: string;
  RequestGuid: string;
  RequestDocuments: IRequestDocument[];
}

/**
 * Attachment payload used when creating a document
 */
export interface IAttachment {
  AttachmentGuid: string; // Empty GUID for new attachments
  MimeType: string;
  FileName: string;
  Size: number;
  AttachmentBody: string; // Base64 without data URI prefix
}

/**
 * Create Document API payload
 * Uses details returned from RequestDocuments in the create-and-submit response
 */
export interface ICreateDocumentPayload {
  DocumentName: string;
  DocumentGuid: string;
  DocumentDescription: string;
  Attachment: IAttachment;
  pageIndex: number;
  entityName: string;
}
