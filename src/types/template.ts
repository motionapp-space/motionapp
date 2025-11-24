export interface PlanTemplate {
  id: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  data: any; // Plan editor JSON schema
  category?: string;
  created_by_id?: string;
}

export interface PlanTemplateTag {
  id: string;
  coach_id: string;
  label: string;
  color?: string;
  created_at: string;
}

export interface TemplateWithTags extends PlanTemplate {
  tags?: PlanTemplateTag[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  data: any;
  category?: string;
  tags?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  data?: any;
  category?: string;
  tags?: string[];
}

// Re-export ClientPlan from the features module to avoid duplication
export type { ClientPlan } from '@/features/client-plans/types';

export interface ClientPlanWithTemplate {
  id: string;
  client_id: string;
  coach_id: string;
  name: string;
  description?: string;
  data: any;
  status: 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO';
  is_visible: boolean;
  is_in_use: boolean;
  locked_at?: string;
  completed_at?: string;
  deleted_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  derived_from_template_id?: string;
  template?: PlanTemplate;
}

export interface AssignTemplateInput {
  template_id: string;
  personalize?: boolean;
  name_override?: string;
  description?: string;
  data_override?: any;
}

export interface SaveAsTemplateInput {
  name: string;
  description?: string;
  also_assign?: boolean;
}
