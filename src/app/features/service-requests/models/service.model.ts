/**
 * Service request models
 */

export enum RequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ServiceCategory {
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  TRADE = 'trade',
  INVESTMENT = 'investment',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  CONSUMER_PROTECTION = 'consumer_protection'
}

export interface Service {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: ServiceCategory;
  icon?: string;
  fee: number;
  currency: string;
  estimatedProcessingTime: string;
  estimatedProcessingTimeAr?: string;
  requiredDocuments?: string[];
  eligibilityCriteria?: string[];
  formId: string;
  active: boolean;
  popular?: boolean;
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  serviceId: string;
  serviceName: string;
  status: RequestStatus;
  submittedAt: string;
  updatedAt: string;
  completedAt?: string;
  formData: any;
  paymentTransactionId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  comments?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface RequestStatusHistory {
  status: RequestStatus;
  timestamp: string;
  updatedBy: string;
  comment?: string;
}

