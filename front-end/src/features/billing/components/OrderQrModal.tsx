import React from 'react';
import { Alert, Button, Modal, Space } from '@/components/ui/Primitives';
import styles from '@/features/billing/components/OrderQrModal.module.css';
import { OrderQrModalProps } from '@/features/billing/types/OrderQrModalProps';

/**
 * Payment receipt: transfer content, payable amount and the VietQR code issued by the server.
 */
export const OrderQrModal: React.FC<OrderQrModalProps> = ({ order, onClose }) => {
  return (
    <Modal
      open={Boolean(order)}
      title="Thanh toán đơn hàng qua VietQR"
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Hoàn tất
        </Button>,
      ]}
    >
      {order && (
        <Space direction="vertical" size={12} className={`lp-full-width ${styles.body}`}>
          <Alert
            type="success"
            showIcon
            message={`Nội dung chuyển khoản: ${order.transferCode}`}
            description={`Số tiền cần thanh toán: ${order.amount.toLocaleString('vi-VN')} ${order.currency}`}
          />
          <img className={styles.qr} src={order.vietQrUrl} alt="Mã VietQR thanh toán" />
        </Space>
      )}
    </Modal>
  );
};
