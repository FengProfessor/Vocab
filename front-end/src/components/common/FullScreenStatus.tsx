import React from 'react';
import { Spin, Typography } from 'antd';
import styles from '@/components/common/FullScreenStatus.module.css';
import { FullScreenStatusProps } from '@/components/types/FullScreenStatusProps';

/**
 * Full-viewport loading state with a status message, shared by the authentication hand-off screens
 * (session verification, Google callback, post-login completion).
 */
export const FullScreenStatus: React.FC<FullScreenStatusProps> = ({ message, hint }) => {
  return (
    <div className={styles.screen}>
      <Spin size="large" />
      <Typography.Text strong className={styles.message}>
        {message}
      </Typography.Text>
      {hint && (
        <Typography.Text type="secondary" className={styles.hint}>
          {hint}
        </Typography.Text>
      )}
    </div>
  );
};
