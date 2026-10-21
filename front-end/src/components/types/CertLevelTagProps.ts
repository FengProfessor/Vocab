import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Props for the CertLevelTag component.
 */
export interface CertLevelTagProps {
  /** Target CEFR / VSTEP certification level. */
  level: CertLevel | 'BELOW_B1';
}
