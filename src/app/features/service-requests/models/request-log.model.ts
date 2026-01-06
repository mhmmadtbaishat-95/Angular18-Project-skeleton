import { ServiceRequest, RequestStatus } from './service.model';

/**
 * Request log entry interface
 * Extended from ServiceRequest with applicant information
 */
export interface RequestLogEntry extends ServiceRequest {
  applicantName: string;
  applicantNameAr?: string;
  serviceNameAr?: string; // Arabic service name for display
}
