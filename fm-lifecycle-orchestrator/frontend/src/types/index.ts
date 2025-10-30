export enum OnboardingStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export enum StageStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export enum StageName {
  LEGAL_ENTITY_SETUP = 'Legal Entity Setup',
  REG_CLASSIFICATION = 'Regulatory Classification',
  FM_ACCOUNT_REQUEST = 'FM Account Request',
  STATIC_DATA_ENRICHMENT = 'Static Data Enrichment',
  SSI_VALIDATION = 'SSI Validation',
  VALUATION_SETUP = 'Valuation Setup',
}

export enum RegulatoryFramework {
  MIFID_II = 'MiFID II',
  EMIR = 'EMIR',
  DODD_FRANK = 'Dodd-Frank',
  RBI = 'RBI',
  MAS = 'MAS',
  HKMA = 'HKMA',
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

export enum DocumentCategory {
  CLIENT_CONFIRMATION = 'client_confirmation',
  RM_ATTESTATION = 'rm_attestation',
  ENTITY_DOCUMENTATION = 'entity_documentation',
  PRODUCT_ELIGIBILITY = 'product_eligibility',
  FINANCIAL_STATEMENTS = 'financial_statements',
  REGISTRATION_CERTIFICATE = 'registration_certificate',
  OTHER = 'other',
}

export enum OCRStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  REVIEW = 'review',
}

export interface Client {
  id: number;
  name: string;
  legal_entity_id: string;
  jurisdiction: string;
  entity_type: string;
  onboarding_status: OnboardingStatus;
  created_date: string;
  last_updated: string;
  assigned_rm: string;
  current_stage?: string;
  blocked_tasks_count?: number;
  pending_documents_count?: number;
}

export interface OnboardingStage {
  id: number;
  client_id: number;
  stage_name: StageName;
  status: StageStatus;
  assigned_team: string;
  started_date: string | null;
  completed_date: string | null;
  notes: string | null;
  order: number;
}

export interface RegulatoryClassification {
  id: number;
  client_id: number;
  framework: RegulatoryFramework;
  classification: string;
  classification_date: string;
  last_review_date: string | null;
  next_review_date: string | null;
  validation_status: ValidationStatus;
  validation_notes: string | null;
  additional_data: any;
  document_count: number;
}

export interface Document {
  id: number;
  client_id: number;
  regulatory_classification_id: number | null;
  filename: string;
  file_path: string;
  file_type: string;
  upload_date: string;
  uploaded_by: string | null;
  document_category: DocumentCategory;
  ocr_status: OCRStatus;
  extracted_text: string | null;
  ai_validation_result: DocumentValidationResult | null;
}

export interface DocumentValidationResult {
  extracted_entities: Record<string, any>;
  validation_checks: Record<string, boolean>;
  confidence_score: number;
  recommendations: string[];
  extracted_text_preview: string;
}

export interface Task {
  id: number;
  client_id: number;
  onboarding_stage_id: number | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_team: string | null;
  status: TaskStatus;
  task_type: TaskType;
  due_date: string | null;
  completed_date: string | null;
  created_date: string;
}

export interface RegulatoryDocumentRequirement {
  id: string;
  framework: RegulatoryFramework;
  classification: string;
  documentCategory: DocumentCategory;
  categoryLabel: string;
  description: string;
  isMandatory: boolean;
  validityPeriodDays: number | null;
}

export interface ClientDocumentStatus {
  client_id: number;
  client_name: string;
  framework: RegulatoryFramework;
  classification: string;
  validation_status: ValidationStatus;
  requirements: DocumentRequirementStatus[];
  compliance_percentage: number;
  missing_mandatory_count: number;
  overdue_count: number;
}

export interface DocumentRequirementStatus {
  requirement: RegulatoryDocumentRequirement;
  documents: Document[];
  status: 'compliant' | 'missing' | 'expired' | 'pending_review';
  latestDocument?: Document;
  expiryDate?: string;
}

// Classification Rules Types
export interface ClassificationRule {
  id: number;
  regime: string;
  rule_type: string;
  rule_name: string;
  rule_config: Record<string, any>;
  description: string | null;
  is_active: boolean;
  version: number;
  created_date: string;
  updated_date: string;
  created_by: string | null;
}

export interface ClassificationRuleCreate {
  regime: string;
  rule_type: string;
  rule_name: string;
  rule_config: Record<string, any>;
  description?: string;
  is_active?: boolean;
  created_by?: string;
}

export interface ClassificationRuleUpdate {
  rule_config?: Record<string, any>;
  description?: string;
  is_active?: boolean;
}

// Regime Eligibility Types
export interface RegimeEligibility {
  id: number;
  client_id: number;
  regime: string;
  is_eligible: boolean;
  eligibility_reason: string | null;
  matched_rules: Array<{
    rule_id: number;
    rule_type: string;
    rule_name: string;
  }> | null;
  unmatched_rules: Array<{
    rule_id: number;
    rule_type: string;
    rule_name: string;
    expected: any;
    actual: any;
  }> | null;
  client_attributes: Record<string, any> | null;
  rule_version: number | null;
  last_evaluated_date: string;
  created_date: string;
}

export interface EvaluationResult {
  eligibility_id: number;
  is_eligible: boolean;
  reason: string;
  matched_rules: Array<{
    rule_id: number;
    rule_type: string;
    rule_name: string;
  }>;
  unmatched_rules: Array<{
    rule_id: number;
    rule_type: string;
    rule_name: string;
    expected: any;
    actual: any;
  }>;
  client_attributes: Record<string, any>;
  evaluated_at: string;
}

// Mandatory Evidence Types
export interface MandatoryEvidence {
  id: number;
  regime: string;
  evidence_type: string;
  evidence_name: string;
  category: string;
  description: string | null;
  is_mandatory: boolean;
  validity_days: number | null;
  is_active: boolean;
  created_date: string;
  updated_date: string;
}

export interface DataQualityResult {
  quality_score: number;
  total_evidences: number;
  completed_evidences: number;
  missing_evidences: Array<{
    evidence_id: number;
    evidence_type: string;
    evidence_name: string;
    category: string;
    description: string | null;
  }>;
  warnings: string[];
}

// Client Attributes
export interface ClientAttributes {
  account_type?: string;
  booking_location?: string;
  product_grid?: {
    product_group?: string;
    product_category?: string;
    product_type?: string;
    product_status?: string;
    bank_entity?: string;
  };
  [key: string]: any;
}
