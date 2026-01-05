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

