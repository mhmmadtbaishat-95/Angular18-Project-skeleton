/**
 * Form field definition models
 * Used to define dynamic forms from JSON
 */

export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  TEL = 'tel',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  DATETIME = 'datetime-local',
  FILE = 'file',
  PASSWORD = 'password',
  CARD_NUMBER = 'card-number',
  CARD_EXPIRY = 'card-expiry',
  CARD_CVV = 'card-cvv'
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN = 'min',
  MAX = 'max',
  PATTERN = 'pattern',
  EMAIL = 'email',
  CUSTOM = 'custom'
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
}

export interface FormField {
  key: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validations?: ValidationRule[];
  options?: SelectOption[]; // For select, radio, checkbox
  rows?: number; // For textarea
  accept?: string; // For file input
  multiple?: boolean; // For file input
  conditionalLogic?: ConditionalLogic[];
  helpText?: string;
  className?: string;
  group?: string; // For grouping fields
  order?: number; // For ordering fields
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
  order?: number;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  sections: FormSection[];
  order?: number;
}

export interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  sections?: FormSection[]; // Legacy support
  steps?: FormStep[]; // New step-based structure
  submitLabel?: string;
  cancelLabel?: string;
  includePayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  enableSteps?: boolean; // Enable step-based workflow
}

