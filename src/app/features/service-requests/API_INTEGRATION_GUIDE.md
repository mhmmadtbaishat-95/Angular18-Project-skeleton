# API Integration Guide for Service Request Forms

This guide explains how to integrate the service request forms with your backend API. The code is structured so that switching from mock data to real API calls is just a matter of changing a configuration flag.

## Quick Start

When your API is ready, simply:

1. **Set `useMockApi: false`** in `src/environments/environment.ts` (or `environment.production.ts`)
2. **Update the API URL** in the environment file
3. **That's it!** The forms will automatically use your real API endpoints

## Architecture

### 1. Endpoints Configuration

All API endpoints are defined in `src/app/data-access/http/endpoints.ts`:

```typescript
export const SERVICE_REQUEST_ENDPOINTS = {
  BASE: '/service-requests',
  SUBMIT: '/service-requests',
  BY_ID: '/service-requests/:id',
  LIST: '/service-requests',
  DEVELOPER_INFO: '/developers/current',
  UPLOAD_DOCUMENTS: '/service-requests/:id/documents',
  SERVICES: '/services',
  SERVICE_BY_ID: '/services/:id',
} as const;
```

### 2. Service Layer

The `ServiceRequestService` handles all API calls. It automatically switches between mock and real API based on the `useMockApi` flag in the environment.

### 3. Data Models

All request/response interfaces are defined in `src/app/features/service-requests/models/api-request.model.ts`:

- `IDeveloperInfo` - Developer information response
- `IServiceRequestPayload` - Form submission payload
- `IServiceRequestResponse` - Submission response
- `IDocumentUploadResponse` - Document upload response

## API Endpoints Required

### 1. Get Developer Information
**Endpoint:** `GET /developers/current`

**Response:**
```json
{
  "data": {
    "developerRegistrationNumber": "DEV-2024-001234",
    "developerName": "Qatar Real Estate Development Co.",
    "developerType": "Legal",
    "licenseStatus": "Active",
    "licenseExpirationDate": "2025-12-31"
  }
}
```

### 2. Submit Service Request
**Endpoint:** `POST /service-requests`

**Request Body:**
```json
{
  "developerRegistrationNumber": "DEV-2024-001234",
  "developerName": "Qatar Real Estate Development Co.",
  "developerType": "Legal",
  "licenseStatus": "Active",
  "licenseExpirationDate": "2025-12-31",
  "projectName": "Project Name",
  "projectType": "Residential",
  "area": "Doha",
  "plotNumber": "12345",
  "landArea": "5000",
  "numberOfUnits": 50,
  "executionPeriod": 24,
  "planType": "Master Plan",
  "designStage": "Preliminary",
  "numberOfBuildings": 5,
  "numberOfDevelopmentStages": 2,
  "approximateHeight": 10,
  "isOffPlan": true,
  "bankName": "Qatar National Bank",
  "estimatedProjectValue": 50000000,
  "numberOfUnitsForSale": 40,
  "startSaleDate": "2024-06-01",
  "expectedDeliveryDate": "2026-06-01",
  "downPaymentPercentage": 20,
  "serviceId": "1",
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "data": {
    "id": "SR-2024-001234",
    "requestNumber": "SR-2024-001234",
    "status": "submitted",
    "submittedAt": "2024-01-15T10:30:00Z",
    "message": "Request submitted successfully"
  }
}
```

### 3. Upload Documents
**Endpoint:** `POST /service-requests/:id/documents`

**Request:** `multipart/form-data` with files

**Response:**
```json
{
  "data": [
    {
      "documentId": "DOC-123",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "fileUrl": "https://api.example.com/documents/DOC-123",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 4. Get Service by ID
**Endpoint:** `GET /services/:id`

**Response:**
```json
{
  "data": {
    "id": "1",
    "code": "MOCI-CL-001",
    "name": "Commercial License Application",
    "nameAr": "طلب ترخيص تجاري",
    "description": "...",
    "category": "COMMERCIAL",
    "fee": 5000,
    "currency": "QAR"
  }
}
```

## Switching to Real API

### Step 1: Update Environment Configuration

**Development (`src/environments/environment.ts`):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Your API URL
  useMockApi: false, // Change to false when API is ready
  // ... rest of config
};
```

**Production (`src/environments/environment.production.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api', // Your production API URL
  useMockApi: false, // Set to false for production
  // ... rest of config
};
```

### Step 2: Verify API Response Format

The service expects responses in this format:
```json
{
  "data": { ... },
  "message": "Success",
  "status": "success"
}
```

If your API returns data directly (without the wrapper), you may need to adjust the `HttpClientService` mapping.

### Step 3: Test the Integration

1. Start your backend API
2. Set `useMockApi: false`
3. Test the form submission
4. Verify developer info loads correctly
5. Test document uploads

## File Upload Handling

The service uses `FormData` for file uploads. The `uploadDocuments` method:

1. Creates a `FormData` object
2. Appends all files with the key `files`
3. Sends to the upload endpoint
4. Returns an array of uploaded document metadata

**Example API endpoint implementation:**
```javascript
// Express.js example
app.post('/api/service-requests/:id/documents', upload.array('files'), (req, res) => {
  const files = req.files.map(file => ({
    documentId: generateId(),
    fileName: file.originalname,
    fileSize: file.size,
    fileUrl: `/documents/${file.filename}`,
    uploadedAt: new Date().toISOString()
  }));
  
  res.json({ data: files });
});
```

## Error Handling

The service includes error handling. If an API call fails:

- The error is logged to the console
- User sees a notification (via `NotificationService`)
- Form remains in current state (doesn't navigate away)

You can customize error handling in the component's `subscribe` error callbacks.

## Testing with Mock Data

While developing, keep `useMockApi: true` to:
- Test the UI without a backend
- Develop frontend features independently
- Demo the application

## Additional Notes

- All dates are sent as ISO strings (`YYYY-MM-DD` or ISO 8601)
- File sizes are in bytes
- Percentages are sent as numbers (e.g., 20 for 20%)
- The service automatically includes authentication tokens via interceptors
- All endpoints are relative to `environment.apiUrl`

## Troubleshooting

**Issue: API calls not working**
- Check `environment.apiUrl` is correct
- Verify `useMockApi: false` is set
- Check browser console for CORS errors
- Verify authentication tokens are being sent

**Issue: File uploads failing**
- Ensure endpoint accepts `multipart/form-data`
- Check file size limits on backend
- Verify CORS allows file uploads

**Issue: Developer info not loading**
- Check the endpoint returns data in expected format
- Verify authentication is working
- Check browser network tab for actual request/response

