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

export interface ClientPlan {
  id: string;
  client_id: string;
  coach_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  data: any; // Plan editor JSON schema
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  derived_from_template_id?: string;
}

export interface ClientPlanWithTemplate extends ClientPlan {
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
