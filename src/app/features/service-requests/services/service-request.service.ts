import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormDefinition } from '../models/form-field.model';
import { Service, ServiceRequest, RequestStatus, ServiceCategory } from '../models/service.model';
import { RequestLogEntry } from '../models/request-log.model';
import { HttpClientService } from '@data/http/services/http-client.service';
import { ENDPOINTS, buildEndpoint } from '@data/http/endpoints';
import { environment } from '../../../../environments/environment';
import { 
  IDeveloperInfo, 
  IServiceRequestPayload, 
  IServiceRequestResponse,
  IDocumentUploadResponse,
  ICreateAndSubmitRequestPayload,
  ICreateAndSubmitRequestResponse,
  ICreateDocumentPayload
} from '../models/api-request.model';
import { IDocumentType, IDocumentTypesResponse } from '../models/document.model';

/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

/**
 * Service request service
 * Handles form definitions and service request submissions
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private readonly httpClient = inject(HttpClientService);
  private readonly http = inject(HttpClient); // Direct HttpClient for file uploads
  
  // Environment flag to switch between mock and real API
  // Set useMockApi to false in environment.ts when API is ready
  private readonly useMockData = environment.useMockApi !== false;

  /**
   * Gets form definition by ID
   * In a real application, this would fetch from an API
   */
  getFormDefinition(formId: string): Observable<FormDefinition> {
    // In production, this would be: return this.httpClient.get<FormDefinition>(`/api/forms/${formId}`);
    // For demo purposes, we'll return mock data
    return of(this.getMockFormDefinition(formId)).pipe(delay(500));
  }

  /**
   * Processes payment
   */
  processPayment(paymentData: any): Observable<PaymentResult> {
    // In production, this would be: return this.httpClient.post<PaymentResult>('/api/payments/process', paymentData);
    // For demo purposes, simulate payment processing
    return of({
      success: true,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Payment processed successfully'
    }).pipe(delay(1500));
  }

  /**
   * Gets current developer information
   * This will be pre-populated in the form (read-only)
   */
  getDeveloperInfo(): Observable<IDeveloperInfo> {
    if (this.useMockData) {
      console.log('⚠️ Using MOCK data for developer info (useMockApi is true)');
      // Mock data for development
      const mockData: IDeveloperInfo = {
        developerRegistrationNumber: 'DEV-2024-001234',
        developerName: 'Qatar Real Estate Development Co.',
        developerType: 'Legal' as 'Natural' | 'Legal',
        licenseStatus: 'Active' as 'Active' | 'Expired' | 'Suspended' | 'Pending',
        licenseExpirationDate: '2025-12-31'
      };
      return of(mockData).pipe(delay(500));
    }
    
    // Real API call - use raw HttpClient to handle response structure
    const accountGuid = 'ff846f37-4fe2-4291-97b9-ef92b45bac9c'; // TODO: Get from auth context
    const url = `${environment.apiUrl}${ENDPOINTS.SERVICE_REQUEST.DEVELOPER_INFO}?accountGuid=${accountGuid}`;
    console.log('📡 Calling developer info API:', url);
    return this.http.post<any>(url, null).pipe(
      map((response) => {
        console.log('📥 Raw API response:', response);
        // API returns: { IsSuccess: boolean, Data: {...}, StatusCode: number, Message: string, Errors: null }
        // Extract developer info from response.Data
        if (!response || !response.Data) {
          console.warn('⚠️ Unexpected developer info response structure:', response);
          // Return empty values if response structure is unexpected
          return {
            developerRegistrationNumber: '',
            developerName: '',
            developerType: '' as 'Natural' | 'Legal',
            licenseStatus: '' as 'Active' | 'Expired' | 'Suspended' | 'Pending',
            licenseExpirationDate: ''
          } as IDeveloperInfo;
        }

        const developerData = response.Data;
        console.log('📋 Developer data extracted:', developerData);

        // Map PascalCase API response to camelCase IDeveloperInfo interface
        // Handle null values by providing empty strings (no defaults)
        const mappedData: IDeveloperInfo = {
          developerRegistrationNumber: developerData.DeveloperRegistrationNumber ?? '',
          developerName: developerData.DeveloperName ?? '',
          developerType: (developerData.TypeOfDeveloper ?? '') as 'Natural' | 'Legal',
          licenseStatus: (developerData.LicenseStatus ?? '') as 'Active' | 'Expired' | 'Suspended' | 'Pending',
          licenseExpirationDate: developerData.LicenseExpirationDate ?? ''
        };
        console.log('✅ Mapped developer info:', mappedData);
        return mappedData;
      })
    );
  }

  /**
   * Submits service request
   * When API is ready, just set useMockData to false
   */
  submitServiceRequest(requestData: IServiceRequestPayload): Observable<IServiceRequestResponse> {
    if (this.useMockData) {
      // Mock response for development
      return of({
        id: `SR-${Date.now()}`,
        requestNumber: `SR-${Date.now()}`,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        message: 'Request submitted successfully'
      }).pipe(delay(1000));
    }
    
    // Real API call - just uncomment when API is ready
    return this.httpClient.post<IServiceRequestResponse>(
      ENDPOINTS.SERVICE_REQUEST.SUBMIT,
      requestData
    );
  }

  /**
   * Creates and submits a service request using the new API endpoint
   * Maps form data to API format and handles response with RequestDocuments
   */
  createAndSubmitRequest(payload: ICreateAndSubmitRequestPayload): Observable<ICreateAndSubmitRequestResponse> {
    // Use raw HttpClient to handle response structure
    return this.http.post<any>(
      `${environment.apiUrl}${ENDPOINTS.SERVICE_REQUEST.CREATE_AND_SUBMIT}`,
      payload
    ).pipe(
      map((response) => {
        console.log('📥 Create and Submit Request API response:', response);
        
        // API returns: { IsSuccess: boolean, Data: {...}, StatusCode: number, Message: string, Errors: null }
        if (!response || !response.Data) {
          console.warn('⚠️ Unexpected create and submit response structure:', response);
          throw new Error('Invalid response structure from API');
        }

        const data = response.Data;
        
        // Map API response to interface
        return {
          RequestNumber: data.RequestNumber || '',
          RequestGuid: data.RequestGuid || '',
          RequestDocuments: data.RequestDocuments || []
        } as ICreateAndSubmitRequestResponse;
      })
    );
  }

  /**
   * Creates a document by uploading a single file
   * Uses the document details from RequestDocuments in submit response
   */
  createDocument(payload: ICreateDocumentPayload): Observable<any> {
    // Use raw HttpClient to handle response structure
    return this.http.post<any>(
      `${environment.apiUrl}${ENDPOINTS.SERVICE_REQUEST.CREATE_DOCUMENT}`,
      payload
    ).pipe(
      map((response) => {
        console.log('📥 Create Document API response:', response);
        
        // API returns: { IsSuccess: boolean, Data: {...}, StatusCode: number, Message: string, Errors: null }
        if (!response || !response.IsSuccess) {
          console.warn('⚠️ Document upload failed:', response);
          throw new Error(response?.Message || 'Failed to upload document');
        }

        return response.Data || response;
      })
    );
  }

  /**
   * Uploads documents for a service request
   * Handles file uploads with FormData
   */
  uploadDocuments(requestId: string, files: File[]): Observable<IDocumentUploadResponse[]> {
    if (this.useMockData) {
      // Mock response for development
      const mockResponses: IDocumentUploadResponse[] = files.map((file, index) => ({
        documentId: `DOC-${Date.now()}-${index}`,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: `https://aqaratintegrations.azurewebsites.net/API/documents/DOC-${Date.now()}-${index}`,
        uploadedAt: new Date().toISOString()
      }));
      return of(mockResponses).pipe(delay(1500));
    }
    
    // Real API call - FormData for file uploads
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    
    const endpoint = buildEndpoint(ENDPOINTS.SERVICE_REQUEST.UPLOAD_DOCUMENTS, { id: requestId });
    
    // Use HttpClient directly for file uploads (FormData)
    return this.http.post<{ data: IDocumentUploadResponse[] }>(
      `${environment.apiUrl}${endpoint}`,
      formData
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    ).pipe(
      map((response: any) => response.data || response)
    );
  }

  /**
   * Gets available services
   */
  getAvailableServices(): Observable<Service[]> {
    // In production: return this.httpClient.get<Service[]>('/api/services');
    return of(this.getMockServices()).pipe(delay(500));
  }

  /**
   * Gets user's service requests
   */
  getUserRequests(): Observable<ServiceRequest[]> {
    // In production: return this.httpClient.get<ServiceRequest[]>('/api/service-requests');
    return of(this.getMockRequests()).pipe(delay(500));
  }

  /**
   * Gets request log entries (all requests with applicant information)
   * This is for administrative/log viewing purposes
   */
getRequestLog(): Observable<RequestLogEntry[]> {
  const params = new HttpParams()
    .set('accountGuid', 'ff846f37-4fe2-4291-97b9-ef92b45bac9c');

  // Use raw HttpClient to get full response structure
  // since HttpClientService automatically extracts response.data
  return this.http.post<any>(
    `${environment.apiUrl}/Request/GetAllRequestsByDeveloperGuid?accountGuid=ff846f37-4fe2-4291-97b9-ef92b45bac9c`,
    null
  ).pipe(
    map((response) => {
      // API returns: { IsSuccess: boolean, Data: { Requests: [...] }, StatusCode: number, Message: string, Errors: null }
      // Extract the Requests array from response.Data.Requests
      let requests: any[] = [];
      
      if (response && response.Data && response.Data.Requests) {
        requests = Array.isArray(response.Data.Requests) ? response.Data.Requests : [];
      } else if (response && response.Data && Array.isArray(response.Data)) {
        requests = response.Data;
      } else if (Array.isArray(response)) {
        requests = response;
      } else {
        console.warn('Unexpected response structure:', response);
        return [];
      }

      // Map API response (PascalCase) to RequestLogEntry model (camelCase)
      return requests.map((item: any) => {
        // Map ExternalStatus to RequestStatus enum
        const mapStatus = (externalStatus: string): RequestStatus => {
          const statusMap: Record<string, RequestStatus> = {
            'Draft': RequestStatus.DRAFT,
            'Submitted': RequestStatus.SUBMITTED,
            'InReview': RequestStatus.IN_REVIEW,
            'Approved': RequestStatus.APPROVED,
            'Rejected': RequestStatus.REJECTED,
            'InProgress': RequestStatus.IN_PROGRESS,
            'Completed': RequestStatus.COMPLETED,
            'Cancelled': RequestStatus.CANCELLED,
            'Closed': RequestStatus.CANCELLED
          };
          return statusMap[externalStatus] || RequestStatus.DRAFT;
        };

        const now = new Date().toISOString();
        return {
          id: item.Id || item.id || '',
          requestNumber: item.RequestNumber || item.requestNumber || '',
          serviceId: item.ServiceId || item.serviceId || '',
          // Prefer ProcessTemplate fields from API if present, fallback to ServiceName
          serviceName: item.ProcessTemplate || item.ServiceName || item.serviceName || 'Unknown Service',
          serviceNameAr: item.ProcessTemplateAr || item.ServiceNameAr || item.serviceNameAr,
          status: mapStatus(item.ExternalStatus || item.externalStatus || item.Status || item.status || 'Draft'),
          submittedAt: item.SubmittedAt || item.submittedAt || now,
          updatedAt: item.UpdatedAt || item.updatedAt || now,
          completedAt: item.CompletedAt || item.completedAt,
          formData: item.FormData || item.formData || {},
          paymentStatus: item.PaymentStatus || item.paymentStatus,
          comments: item.DeveloperComments || item.AqaratComments || item.Comments || item.comments,
          applicantName: item.ApplicantName || item.applicantName || 'Unknown Applicant',
          applicantNameAr: item.ApplicantNameAr || item.applicantNameAr
        } as RequestLogEntry;
      });
    })
  );
}
  /**
   * Gets a specific service request by ID
   */
  getRequestById(requestId: string): Observable<ServiceRequest | null> {
    // In production: return this.httpClient.get<ServiceRequest>(`/api/service-requests/${requestId}`);
    const requests = this.getMockRequests();
    const request = requests.find(r => r.id === requestId) || null;
    return of(request).pipe(delay(300));
  }

  /**
   * Gets a specific service by ID
   */
  getService(serviceId: string): Observable<Service | null> {
    if (this.useMockData) {
      const services = this.getMockServices();
      const service = services.find(s => s.id === serviceId) || null;
      return of(service).pipe(delay(300));
    }
    
    // Real API call
    const endpoint = buildEndpoint(ENDPOINTS.SERVICE_REQUEST.SERVICE_BY_ID, { id: serviceId });
    return this.httpClient.get<Service>(endpoint);
  }

  /**
   * Gets required document types for service request
   */
  getDocumentTypes(serviceId?: string): Observable<IDocumentType[]> {
    if (this.useMockData) {
      // Mock document types
      const mockDocumentTypes: IDocumentType[] = [
        {
          id: '1',
          name: 'Land Plan',
          nameAr: 'مخطط الارض',
          required: true,
          description: 'Land plan document',
          descriptionAr: 'مخطط الأرض',
          allowedFormats: ['pdf', 'jpg', 'png'],
          maxSize: 2 * 1024 * 1024 // 2 MB
        },
        {
          id: '2',
          name: 'Building Permit',
          nameAr: 'رخصة البناء',
          required: true,
          description: 'Building permit document',
          descriptionAr: 'رخصة البناء',
          allowedFormats: ['pdf', 'jpg', 'png'],
          maxSize: 2 * 1024 * 1024
        },
        {
          id: '3',
          name: 'Commercial License',
          nameAr: 'الترخيص التجاري',
          required: false,
          description: 'Commercial license document',
          descriptionAr: 'الترخيص التجاري',
          allowedFormats: ['pdf', 'jpg', 'png'],
          maxSize: 2 * 1024 * 1024
        }
      ];
      return of(mockDocumentTypes).pipe(delay(500));
    }
    
    // Real API call
    const endpoint = serviceId 
      ? `${ENDPOINTS.SERVICE_REQUEST.DOCUMENT_TYPES}?serviceId=${serviceId}`
      : ENDPOINTS.SERVICE_REQUEST.DOCUMENT_TYPES;
    return this.httpClient.get<IDocumentTypesResponse>(endpoint).pipe(
      map(response => response.documentTypes || [])
    );
  }

  /**
   * Gets mock services for demo
   */
  private getMockServices(): Service[] {
    return [
      {
        id: '1',
        code: 'MOCI-CL-001',
        name: 'Commercial License Application',
        nameAr: 'طلب ترخيص تجاري',
        description: 'Apply for a new commercial license to start your business in Qatar',
        descriptionAr: 'تقديم طلب للحصول على ترخيص تجاري جديد لبدء عملك في قطر',
        category: ServiceCategory.COMMERCIAL,
        fee: 5000,
        currency: 'QAR',
        estimatedProcessingTime: '5-7 business days',
        estimatedProcessingTimeAr: '5-7 أيام عمل',
        requiredDocuments: [
          'Valid QID (Qatar ID)',
          'Trade License Application Form',
          'Company Registration Certificate',
          'Memorandum of Association',
          'Power of Attorney (if applicable)',
          'Lease Agreement for Business Premises'
        ],
        eligibilityCriteria: [
          'Qatari citizens',
          'GCC nationals',
          'Foreign investors with valid permits',
          'Registered companies in Qatar',
          'Legal entities authorized to conduct business'
        ],
        formId: 'complex-service',
        active: true,
        popular: true
      },
      {
        id: '2',
        code: 'MOCI-IL-002',
        name: 'Industrial License',
        nameAr: 'ترخيص صناعي',
        description: 'Apply for an industrial license for manufacturing activities',
        descriptionAr: 'تقديم طلب للحصول على ترخيص صناعي للأنشطة التصنيعية',
        category: ServiceCategory.INDUSTRIAL,
        fee: 7500,
        currency: 'QAR',
        estimatedProcessingTime: '7-10 business days',
        requiredDocuments: [
          'Valid QID',
          'Industrial License Application',
          'Factory Location Details',
          'Environmental Impact Assessment',
          'Safety Certificates'
        ],
        eligibilityCriteria: [
          'Manufacturing companies',
          'Industrial facilities',
          'Companies with production activities'
        ],
        formId: 'default',
        active: true,
        popular: false
      },
      {
        id: '3',
        code: 'MOCI-TL-003',
        name: 'Trade License Renewal',
        nameAr: 'تجديد الترخيص التجاري',
        description: 'Renew your existing trade license',
        descriptionAr: 'تجديد ترخيصك التجاري الحالي',
        category: ServiceCategory.TRADE,
        fee: 2000,
        currency: 'QAR',
        estimatedProcessingTime: '3-5 business days',
        formId: 'default',
        active: true,
        popular: true
      },
      {
        id: '4',
        code: 'MOCI-INV-004',
        name: 'Investment License',
        nameAr: 'ترخيص استثماري',
        description: 'Apply for investment license for foreign investments',
        descriptionAr: 'تقديم طلب للحصول على ترخيص استثماري للاستثمارات الأجنبية',
        category: ServiceCategory.INVESTMENT,
        fee: 10000,
        currency: 'QAR',
        estimatedProcessingTime: '10-14 business days',
        formId: 'default',
        active: true,
        popular: false
      },
      {
        id: '5',
        code: 'MOCI-IP-005',
        name: 'Trademark Registration',
        nameAr: 'تسجيل العلامة التجارية',
        description: 'Register your trademark with MOCI',
        descriptionAr: 'تسجيل علامتك التجارية مع وزارة التجارة والصناعة',
        category: ServiceCategory.INTELLECTUAL_PROPERTY,
        fee: 3000,
        currency: 'QAR',
        estimatedProcessingTime: '14-21 business days',
        formId: 'default',
        active: true,
        popular: false
      },
      {
        id: '6',
        code: 'MOCI-CP-006',
        name: 'Consumer Complaint',
        nameAr: 'شكوى المستهلك',
        description: 'File a consumer protection complaint',
        descriptionAr: 'تقديم شكوى حماية المستهلك',
        category: ServiceCategory.CONSUMER_PROTECTION,
        fee: 0,
        currency: 'QAR',
        estimatedProcessingTime: '5-10 business days',
        formId: 'default',
        active: true,
        popular: true
      }
    ];
  }

  /**
   * Gets mock requests for demo
   */
  private getMockRequests(): ServiceRequest[] {
    const now = new Date();
    return [
      {
        id: '1',
        requestNumber: 'SR-2024-001234',
        serviceId: '1',
        serviceName: 'Commercial License Application',
        status: RequestStatus.IN_REVIEW,
        submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'high'
      },
      {
        id: '2',
        requestNumber: 'SR-2024-001189',
        serviceId: '3',
        serviceName: 'Trade License Renewal',
        status: RequestStatus.APPROVED,
        submittedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'medium'
      },
      {
        id: '3',
        requestNumber: 'SR-2024-000987',
        serviceId: '6',
        serviceName: 'Consumer Complaint',
        status: RequestStatus.COMPLETED,
        submittedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        formData: {},
        priority: 'low'
      }
    ];
  }

  /**
   * Gets mock request log entries for demo
   * Includes applicant information for log viewing
   */
  private getMockRequestLogs(): RequestLogEntry[] {
    const now = new Date();
    const submissionDate = new Date(2024, 9, 18); // October 18, 2024
    
    return [
      {
        id: '1',
        requestNumber: '487234',
        serviceId: '1',
        serviceName: 'Registration in the Real Estate Developers Register',
        serviceNameAr: 'القيد بسجل المطورين العقاريين',
        status: RequestStatus.IN_REVIEW,
        submittedAt: submissionDate.toISOString(),
        updatedAt: submissionDate.toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'high',
        applicantName: 'Ahmed Abdullah',
        applicantNameAr: 'أحمد عبدالله'
      },
      {
        id: '2',
        requestNumber: '487234',
        serviceId: '1',
        serviceName: 'Registration in the Real Estate Developers Register',
        serviceNameAr: 'القيد بسجل المطورين العقاريين',
        status: RequestStatus.IN_REVIEW,
        submittedAt: submissionDate.toISOString(),
        updatedAt: submissionDate.toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'high',
        applicantName: 'Ahmed Abdullah',
        applicantNameAr: 'أحمد عبدالله'
      },
      {
        id: '3',
        requestNumber: '487234',
        serviceId: '1',
        serviceName: 'Termination of Registration in the Real Estate Developers Register',
        serviceNameAr: 'إنهاء القيد بسجل المطورين العقاريين',
        status: RequestStatus.CANCELLED,
        submittedAt: submissionDate.toISOString(),
        updatedAt: submissionDate.toISOString(),
        completedAt: submissionDate.toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'medium',
        applicantName: 'Saad Al-Yahya',
        applicantNameAr: 'سعد اليحيى'
      },
      {
        id: '4',
        requestNumber: '487234',
        serviceId: '1',
        serviceName: 'Registration in the Real Estate Developers Register',
        serviceNameAr: 'القيد بسجل المطورين العقاريين',
        status: RequestStatus.APPROVED,
        submittedAt: submissionDate.toISOString(),
        updatedAt: submissionDate.toISOString(),
        completedAt: submissionDate.toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'medium',
        applicantName: 'Ahmed Abdullah',
        applicantNameAr: 'أحمد عبدلله'
      },
      {
        id: '5',
        requestNumber: '487234',
        serviceId: '1',
        serviceName: 'Termination of Registration in the Real Estate Developers Register',
        serviceNameAr: 'إنهاء القيد بسجل المطورين العقاريين',
        status: RequestStatus.REJECTED,
        submittedAt: submissionDate.toISOString(),
        updatedAt: submissionDate.toISOString(),
        formData: {},
        paymentStatus: 'paid',
        priority: 'low',
        applicantName: 'Saad Al-Yahya',
        applicantNameAr: 'سعد اليحيى'
      }
    ];
  }

  /**
   * Gets mock form definition
   * This would typically come from an API or database
   */
  private getMockFormDefinition(formId: string): FormDefinition {
    // Return different forms based on formId
    if (formId === 'complex-service') {
      return this.getComplexServiceForm();
    }
    if (formId === 'premium-service') {
      return this.getPremiumServiceForm();
    }
    // Default form
    return this.getDefaultServiceForm();
  }

  /**
   * Default service request form
   */
  private getDefaultServiceForm(): FormDefinition {
    return {
      id: 'default',
      title: 'Service Request Form',
      description: 'Please fill out the form below to submit your service request.',
      sections: [
        {
          title: 'Contact Information',
          fields: [
            {
              key: 'fullName',
              type: 'text' as any,
              label: 'Full Name',
              required: true,
              validations: [
                { type: 'minLength' as any, value: 3, message: 'Name must be at least 3 characters' }
              ]
            },
            {
              key: 'email',
              type: 'email' as any,
              label: 'Email Address',
              required: true,
              validations: [
                { type: 'email' as any, message: 'Please enter a valid email address' }
              ]
            },
            {
              key: 'phone',
              type: 'tel' as any,
              label: 'Phone Number',
              required: true,
              placeholder: '+974 XXXX XXXX'
            }
          ]
        },
        {
          title: 'Service Details',
          fields: [
            {
              key: 'serviceType',
              type: 'select' as any,
              label: 'Service Type',
              required: true,
              options: [
                { label: 'Select a service', value: '' },
                { label: 'Consultation', value: 'consultation' },
                { label: 'Technical Support', value: 'technical-support' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Installation', value: 'installation' }
              ]
            },
            {
              key: 'description',
              type: 'textarea' as any,
              label: 'Service Description',
              required: true,
              rows: 5,
              placeholder: 'Please describe your service requirements in detail...'
            }
          ]
        }
      ],
      submitLabel: 'Submit Request',
      cancelLabel: 'Cancel'
    };
  }

  /**
   * Complex service form with payment - MOCI Qatar
   */
  private getComplexServiceForm(): FormDefinition {
    return {
      id: 'complex-service',
      title: 'Commercial License Application',
      description: 'Apply for a commercial license with the Ministry of Commerce and Industry, State of Qatar',
      enableSteps: true,
      includePayment: true,
      paymentAmount: 5000,
      paymentCurrency: 'QAR',
      steps: [
        {
          id: 'company-info',
          title: 'Company Information',
          description: 'Provide your company registration details',
          order: 1,
          sections: [
        {
          title: 'Company Information',
          description: 'Please provide your company details',
          fields: [
            {
              key: 'companyName',
              type: 'text' as any,
              label: 'Company Name',
              required: true,
              validations: [
                { type: 'minLength' as any, value: 2, message: 'Company name must be at least 2 characters' }
              ]
            },
            {
              key: 'companyType',
              type: 'select' as any,
              label: 'Company Type',
              required: true,
              options: [
                { label: 'Select company type', value: '' },
                { label: 'LLC', value: 'llc' },
                { label: 'WLL', value: 'wll' },
                { label: 'QSC', value: 'qsc' },
                { label: 'Branch', value: 'branch' },
                { label: 'Other', value: 'other' }
              ]
            },
            {
              key: 'tradeLicense',
              type: 'text' as any,
              label: 'Trade License Number',
              required: true,
              placeholder: 'Enter trade license number'
            },
            {
              key: 'companyAddress',
              type: 'textarea' as any,
              label: 'Company Address',
              required: true,
              rows: 3,
              placeholder: 'Enter full company address'
            }
          ]
        }
        ]
        },
        {
          id: 'contact-details',
          title: 'Contact Information',
          description: 'Primary contact person details',
          order: 2,
          sections: [{
            title: 'Contact Person Details',
            fields: [
            {
              key: 'contactName',
              type: 'text' as any,
              label: 'Contact Person Name',
              required: true
            },
            {
              key: 'contactEmail',
              type: 'email' as any,
              label: 'Contact Email',
              required: true,
              validations: [
                { type: 'email' as any, message: 'Please enter a valid email address' }
              ]
            },
            {
              key: 'contactPhone',
              type: 'tel' as any,
              label: 'Contact Phone',
              required: true,
              placeholder: '+974 XXXX XXXX'
            },
            {
              key: 'contactPosition',
              type: 'text' as any,
              label: 'Position/Title',
              required: true
            }
          ]
        }]
        },
        {
          id: 'service-requirements',
          title: 'Service Requirements',
          description: 'Details about your business activities and requirements',
          order: 3,
          sections: [{
            title: 'Service Requirements',
            fields: [
            {
              key: 'serviceCategory',
              type: 'select' as any,
              label: 'Service Category',
              required: true,
              options: [
                { label: 'Select category', value: '' },
                { label: 'Enterprise Software Development', value: 'enterprise-software' },
                { label: 'Cloud Migration & Infrastructure', value: 'cloud-migration' },
                { label: 'Digital Transformation', value: 'digital-transformation' },
                { label: 'Custom Application Development', value: 'custom-app' },
                { label: 'System Integration', value: 'system-integration' },
                { label: 'Consulting & Advisory', value: 'consulting' }
              ]
            },
            {
              key: 'projectDuration',
              type: 'select' as any,
              label: 'Expected Project Duration',
              required: true,
              options: [
                { label: 'Select duration', value: '' },
                { label: '1-3 months', value: '1-3' },
                { label: '3-6 months', value: '3-6' },
                { label: '6-12 months', value: '6-12' },
                { label: '12+ months', value: '12+' }
              ]
            },
            {
              key: 'budgetRange',
              type: 'select' as any,
              label: 'Budget Range (QAR)',
              required: true,
              options: [
                { label: 'Select budget range', value: '' },
                { label: '50,000 - 100,000', value: '50k-100k' },
                { label: '100,000 - 250,000', value: '100k-250k' },
                { label: '250,000 - 500,000', value: '250k-500k' },
                { label: '500,000 - 1,000,000', value: '500k-1m' },
                { label: '1,000,000+', value: '1m+' }
              ]
            },
            {
              key: 'projectDescription',
              type: 'textarea' as any,
              label: 'Project Description',
              required: true,
              rows: 6,
              placeholder: 'Please provide a detailed description of your project requirements, objectives, and expected outcomes...'
            },
            {
              key: 'technicalRequirements',
              type: 'textarea' as any,
              label: 'Technical Requirements',
              rows: 4,
              placeholder: 'List any specific technical requirements, integrations, or constraints...'
            },
            {
              key: 'urgency',
              type: 'radio' as any,
              label: 'Project Urgency',
              required: true,
              options: [
                { label: 'Low - Flexible timeline', value: 'low' },
                { label: 'Medium - Standard timeline', value: 'medium' },
                { label: 'High - Urgent, needs immediate attention', value: 'high' }
              ]
            }
            ]
          }]
        },
        {
          id: 'additional-info',
          title: 'Additional Documents',
          description: 'Upload supporting documents and provide additional information',
          order: 4,
          sections: [{
            title: 'Additional Information',
            fields: [
            {
              key: 'hasExistingSystem',
              type: 'checkbox' as any,
              label: 'We have existing systems that need integration',
              defaultValue: false
            },
            {
              key: 'preferredStartDate',
              type: 'date' as any,
              label: 'Preferred Start Date',
              required: true
            },
            {
              key: 'supportRequired',
              type: 'checkbox' as any,
              label: 'We require ongoing support and maintenance',
              defaultValue: false
            },
            {
              key: 'additionalDocuments',
              type: 'file' as any,
              label: 'Additional Documents',
              accept: '.pdf,.doc,.docx,.xls,.xlsx',
              multiple: true,
              helpText: 'Upload any relevant documents (PDF, Word, Excel)'
            },
            {
              key: 'specialRequirements',
              type: 'textarea' as any,
              label: 'Special Requirements or Notes',
              rows: 3,
              placeholder: 'Any additional information or special requirements...'
            }
            ]
          }]
        },
        {
          id: 'payment',
          title: 'Payment & Review',
          description: 'Review your application and complete payment',
          order: 5,
          sections: [{
            title: 'Payment Information',
            description: 'Secure payment processing. All transactions are encrypted.',
            fields: [
            {
              key: 'cardholderName',
              type: 'text' as any,
              label: 'Cardholder Name',
              required: true,
              placeholder: 'Name as it appears on card'
            },
            {
              key: 'cardNumber',
              type: 'card-number' as any,
              label: 'Card Number',
              required: true,
              placeholder: '1234 5678 9012 3456',
              validations: [
                { type: 'required' as any, message: 'Card number is required' }
              ]
            },
            {
              key: 'cardExpiry',
              type: 'card-expiry' as any,
              label: 'Expiry Date',
              required: true,
              placeholder: 'MM/YY',
              validations: [
                { type: 'required' as any, message: 'Expiry date is required' }
              ]
            },
            {
              key: 'cardCVV',
              type: 'card-cvv' as any,
              label: 'CVV',
              required: true,
              placeholder: '123',
              validations: [
                { type: 'required' as any, message: 'CVV is required' },
                { type: 'minLength' as any, value: 3, message: 'CVV must be 3-4 digits' }
              ]
            },
            {
              key: 'billingAddress',
              type: 'textarea' as any,
              label: 'Billing Address',
              required: true,
              rows: 3,
              placeholder: 'Enter billing address'
            },
            {
              key: 'agreeToTerms',
              type: 'checkbox' as any,
              label: 'I agree to the terms and conditions and privacy policy',
              required: true,
              defaultValue: false
            }
          ]
        }]
        }
      ],
      submitLabel: 'Submit Application & Pay',
      cancelLabel: 'Cancel'
    };
  }

  /**
   * Premium service form
   */
  private getPremiumServiceForm(): FormDefinition {
    return {
      id: 'premium-service',
      title: 'Premium Service Request',
      description: 'Request our premium service package',
      includePayment: true,
      paymentAmount: 2500,
      paymentCurrency: 'QAR',
      sections: [
        {
          title: 'Personal Information',
          fields: [
            {
              key: 'name',
              type: 'text' as any,
              label: 'Full Name',
              required: true
            },
            {
              key: 'email',
              type: 'email' as any,
              label: 'Email',
              required: true
            },
            {
              key: 'phone',
              type: 'tel' as any,
              label: 'Phone',
              required: true
            }
          ]
        },
        {
          title: 'Payment',
          fields: [
            {
              key: 'cardNumber',
              type: 'card-number' as any,
              label: 'Card Number',
              required: true
            },
            {
              key: 'cardExpiry',
              type: 'card-expiry' as any,
              label: 'Expiry',
              required: true
            },
            {
              key: 'cardCVV',
              type: 'card-cvv' as any,
              label: 'CVV',
              required: true
            }
          ]
        }
      ],
      submitLabel: 'Pay Now',
      cancelLabel: 'Cancel'
    };
  }
}

