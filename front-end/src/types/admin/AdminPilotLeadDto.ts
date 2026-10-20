import { PilotLeadStatus } from '@/types/enums/PilotLeadStatus';

/**
 * Data transfer object representing a pilot teacher lead registration for B2B classroom adoption.
 */
export interface AdminPilotLeadDto {
  /** Unique lead identifier. */
  id: string;
  /** Full name of the applicant teacher. */
  teacherName: string;
  /** Name of the educational institution or language center. */
  organization: string;
  /** Approximate number of students under the teacher's instruction. */
  studentScale: string;
  /** Current CRM pipeline stage. */
  status: PilotLeadStatus;
  /** Contact email address. */
  email?: string;
  /** Contact phone number. */
  phone?: string;
}
