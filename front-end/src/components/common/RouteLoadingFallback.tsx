import React from 'react';
import { Spin } from 'antd';
import styles from '@/components/common/RouteLoadingFallback.module.css';

/**
 * Centered spinner rendered while lazily loaded route chunks are downloading.
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Spin size="large" tip="Đang tải dữ liệu...">
        <div />
      </Spin>
    </div>
  );
};
