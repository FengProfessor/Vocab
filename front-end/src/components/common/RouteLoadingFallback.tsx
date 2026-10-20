import React from 'react';
import { Spin } from 'antd';

/**
 * Centered animated spinner rendered while React.lazy asynchronous route chunks are downloading.
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
      }}
    >
      <Spin size="large" tip="Đang tải dữ liệu..." />
    </div>
  );
};
