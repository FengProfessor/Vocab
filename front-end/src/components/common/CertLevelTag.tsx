import React from 'react';
import { Tag } from 'antd';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Props for the CertLevelTag component.
 */
interface CertLevelTagProps {
  /** Target CEFR / VSTEP certification level. */
  level: CertLevel | 'BELOW_B1';
}

/**
 * Renders a color-coded Ant Design Tag for VSTEP / CEFR certification bands (B1, B2, C1).
 */
export const CertLevelTag: React.FC<CertLevelTagProps> = ({ level }) => {
  if (level === CertLevel.C1) {
    return <Tag color="purple">VSTEP C1 (Bậc 5)</Tag>;
  }
  if (level === CertLevel.B2) {
    return <Tag color="geekblue">VSTEP B2 (Bậc 4)</Tag>;
  }
  if (level === CertLevel.B1) {
    return <Tag color="green">VSTEP B1 (Bậc 3)</Tag>;
  }
  return <Tag color="default">Dưới B1 (Nền tảng)</Tag>;
};
