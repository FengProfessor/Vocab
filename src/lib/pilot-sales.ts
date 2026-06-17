export const PILOT_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
export type PilotLeadStatus = typeof PILOT_LEAD_STATUSES[number];

export interface PilotLead {
  id: string;
  contact_name: string;
  email: string;
  phone: string;
  organization: string;
  teacher_count: number;
  student_count: number;
  message: string | null;
  source: string;
  status: PilotLeadStatus;
  admin_note: string | null;
  contacted_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isPilotLeadStatus(value: unknown): value is PilotLeadStatus {
  return typeof value === 'string' && PILOT_LEAD_STATUSES.includes(value as PilotLeadStatus);
}
