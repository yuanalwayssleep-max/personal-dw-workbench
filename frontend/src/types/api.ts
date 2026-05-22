export interface Environment {
  id: number;
  environment_code: string;
  company_name: string;
  environment_name: string;
  environment_type: string;
  account_name: string | null;
  account_password: string | null;
  query_portal_url: string | null;
  network_mode: string;
  dialect: string;
  timezone: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentEntrypoint {
  id: number;
  entry_type: string;
  entry_name: string;
  entry_url: string;
  description: string | null;
  display_order: number;
}

export interface CapabilityProfile {
  id: number;
  capability_type: string;
  capability_level: string;
  source_type: string;
  adapter_key: string | null;
}

export interface EnvironmentDetail extends Environment {
  entrypoints: EnvironmentEntrypoint[];
  capabilities: CapabilityProfile[];
}

export interface SqlAsset {
  id: number;
  environment_id: number;
  title: string;
  sql_type: string;
  content: string;
  dialect: string;
  summary: string | null;
  tags: Record<string, string> | null;
  is_favorite: boolean;
  status: string;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: number;
  environment_id: number;
  title: string;
  incident_type: string;
  severity: string;
  status: string;
  symptom_desc: string | null;
  impact_scope: string | null;
  root_cause: string | null;
  fix_action: string | null;
  review_note: string | null;
  discovered_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TraceStep {
  id: number;
  incident_id: number;
  step_no: number;
  action_type: string;
  action_desc: string;
  evidence_ref: string | null;
  intermediate_conclusion: string | null;
  created_at: string;
}

export interface IncidentLink {
  id: number;
  incident_id: number;
  target_type: string;
  target_id: number | null;
  target_ref: string | null;
  link_role: string | null;
  created_at: string;
}

export interface KnowledgeNote {
  id: number;
  environment_id: number | null;
  title: string;
  note_type: string;
  content: string;
  summary: string | null;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeStandard {
  id: number;
  standard_name: string;
  standard_type: string;
  company_name: string | null;
  status: string;
  rule_content: string;
  positive_example: string | null;
  negative_example: string | null;
  note: string | null;
  project_ids: string[];
  project_names: string[];
  created_at: string;
  updated_at: string;
}

export interface BusinessGlossary {
  id: number;
  glossary_name: string;
  business_domain: string;
  company_name: string | null;
  definition: string;
  statistical_scope: string | null;
  data_source: string | null;
  note: string | null;
  project_ids: string[];
  project_names: string[];
  created_at: string;
  updated_at: string;
}

export interface MetricDefinition {
  id: number;
  metric_name: string;
  metric_code: string;
  field_type: string;
  business_domain: string;
  metric_category: string;
  company_name: string | null;
  definition: string;
  calculation_rule: string;
  time_granularity: string;
  unit: string | null;
  note: string | null;
  project_ids: string[];
  project_names: string[];
  created_at: string;
  updated_at: string;
}

export interface EntityHistoryEntry {
  id: number;
  entity_type: string;
  entity_key: string;
  action: string;
  title: string;
  description: string;
  created_at: string;
}

export interface DashboardHomeData {
  current_environment: number | null;
  recent_sql_assets: Array<{ id: number; title: string }>;
  pending_incidents: Array<{ id: number; title: string; status: string }>;
  recent_notes: Array<{ id: number; title: string }>;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  companyName: string;
  description: string;
  environmentIds: number[];
  updatedAt: string;
}

export interface ManagedCompany {
  companyName: string;
  projectCount: number;
  environmentCount: number;
  networkModes: string[];
  projectNames: string[];
  note?: string;
  updatedAt: string;
}

export interface WarehouseModel {
  id: number;
  company_name: string;
  project_ids: string[];
  project_names: string[];
  model_code: string;
  model_name: string;
  model_database_name: string;
  model_table_name: string;
  model_business_domain: string;
  model_data_domain: string;
  model_layer: string;
  layer: string;
  subject_domain: string;
  model_type: string;
  storage_type: string;
  table_name: string;
  table_description: string;
  partition_field: string | null;
  owner: string;
  status: string;
  tags: string[];
  schedule_cycle: string;
  refresh_mode: string;
  core_metric: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelSqlDraft {
  id: number;
  model_id: number;
  environment_id: number | null;
  title: string;
  sql_type: string;
  version_no: string;
  description: string | null;
  content: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
