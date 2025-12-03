# Service Request Forms Feature

This feature demonstrates dynamic form rendering from JSON definitions, including complex forms with payment integration.

## Overview

The Service Request Forms feature allows you to:
- Render forms dynamically from JSON definitions
- Handle complex form structures with multiple sections
- Support various field types (text, email, select, radio, checkbox, date, file, payment fields)
- Process payments securely
- Validate form inputs with custom validators
- Apply conditional logic to fields

## Architecture

### Components

1. **DynamicFormRendererComponent** (`components/dynamic-form-renderer/`)
   - Renders forms dynamically from JSON form definitions
   - Handles form validation and error display
   - Supports conditional field logic
   - Formats payment fields (card number, expiry, CVV)

2. **PaymentSummaryComponent** (`components/payment-summary/`)
   - Displays payment summary with breakdown
   - Shows service fees and tax calculations
   - Displays total amount

3. **ServiceRequestPage** (`pages/service-request.page.ts`)
   - Main page component that orchestrates form rendering
   - Handles form submission and payment processing
   - Manages loading states

### Models

- **FormField** - Defines individual form fields
- **FormSection** - Groups related fields
- **FormDefinition** - Complete form structure
- **FieldType** - Enum for field types
- **ValidationRule** - Defines validation rules

### Services

- **ServiceRequestService** - Handles form definitions and submissions
  - `getFormDefinition(id)` - Loads form definition
  - `processPayment(data)` - Processes payment
  - `submitServiceRequest(data)` - Submits service request

## Usage

### Accessing Forms

Navigate to:
- `/service-requests/complex-service` - Complex form with payment
- `/service-requests/premium-service` - Premium service form
- `/service-requests/default` - Default service form

### Form Definition Structure

```typescript
{
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  includePayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  submitLabel?: string;
  cancelLabel?: string;
}
```

### Supported Field Types

- `text` - Text input
- `email` - Email input with validation
- `number` - Number input
- `tel` - Telephone input
- `textarea` - Multi-line text
- `select` - Dropdown select
- `radio` - Radio buttons
- `checkbox` - Checkbox
- `date` - Date picker
- `datetime-local` - Date and time picker
- `file` - File upload
- `password` - Password input
- `card-number` - Credit card number (with formatting)
- `card-expiry` - Card expiry date (MM/YY format)
- `card-cvv` - Card CVV (3-4 digits)

### Validation Rules

- `required` - Field is required
- `minLength` - Minimum length
- `maxLength` - Maximum length
- `min` - Minimum value (for numbers)
- `max` - Maximum value (for numbers)
- `pattern` - Regex pattern
- `email` - Email format validation
- Custom validators for payment fields

### Conditional Logic

Fields can show/hide, enable/disable, or become required/optional based on other field values:

```typescript
conditionalLogic: [{
  field: 'otherField',
  operator: 'equals',
  value: 'someValue',
  action: 'show'
}]
```

Operators: `equals`, `notEquals`, `contains`, `greaterThan`, `lessThan`, `isEmpty`, `isNotEmpty`
Actions: `show`, `hide`, `enable`, `disable`, `require`, `optional`

## Payment Integration

The form supports payment processing with:
- Card number validation (Luhn algorithm)
- Expiry date validation
- CVV validation
- Secure payment processing simulation
- Payment summary with fees and tax

## Example Form Definition

See `src/assets/service-request-forms/complex-service-form.json` for a complete example.

## Showcase for MOSI Qatar

This feature demonstrates:
1. **Complex Form Handling** - Multiple sections, various field types, conditional logic
2. **Payment Integration** - Secure payment processing with validation
3. **Dynamic Rendering** - Forms rendered from JSON, easy to modify and extend
4. **Professional UI** - Modern, responsive design with Tailwind CSS
5. **Validation** - Comprehensive client-side validation
6. **Error Handling** - User-friendly error messages

## Future Enhancements

- Load form definitions from API
- Save form drafts
- Multi-step forms with progress indicator
- File upload with preview
- Integration with real payment gateway
- Form analytics and tracking

