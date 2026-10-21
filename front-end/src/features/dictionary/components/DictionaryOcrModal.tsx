import React, { useState } from 'react';
import { Alert, App, Button, Modal, Space, Typography, Upload } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import styles from '@/features/dictionary/components/DictionaryOcrModal.module.css';
import { DictionaryOcrModalProps } from '@/features/dictionary/types/DictionaryOcrModalProps';
import { useOcrExtractWords } from '@/hooks/dictionary/useOcrExtractWords';

/** Maximum accepted image size, in bytes (5 MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * OCR dialog: upload a photo of a page, extract its English vocabulary and look the words up.
 */
export const DictionaryOcrModal: React.FC<DictionaryOcrModalProps> = ({
  open,
  onClose,
  onSelectTerm,
}) => {
  const { message } = App.useApp();
  const [words, setWords] = useState<string[]>([]);
  const ocr = useOcrExtractWords();

  const handleUpload = (file: File): boolean => {
    if (file.size > MAX_IMAGE_BYTES) {
      void message.error('Ảnh vượt quá 5MB, vui lòng chọn ảnh nhỏ hơn.');
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // The API expects raw base64, without the "data:<mime>;base64," prefix.
      const base64Image = String(reader.result).split(',')[1] ?? '';
      ocr.mutate(
        { base64Image, mimeType: file.type || 'image/jpeg' },
        { onSuccess: (result) => setWords(result) }
      );
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Modal title="Tra cứu từ vựng qua ảnh (OCR)" open={open} onCancel={onClose} footer={null} width={520}>
      <Space direction="vertical" size={16} className="lp-full-width">
        <Alert
          type="info"
          showIcon
          message="Tải lên ảnh chụp đề thi hoặc trang sách để tự động bóc tách từ vựng."
        />

        <Upload.Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={ocr.isPending}
        >
          <p className="ant-upload-drag-icon">
            <CameraOutlined className={styles.dragIcon} />
          </p>
          <Typography.Text strong className={styles.dropTitle}>
            {ocr.isPending ? 'Đang nhận diện...' : 'Bấm hoặc kéo thả ảnh vào đây'}
          </Typography.Text>
          <Typography.Text type="secondary" className={styles.dropHint}>
            JPG, PNG, WEBP — tối đa 5MB
          </Typography.Text>
        </Upload.Dragger>

        {words.length > 0 && (
          <div>
            <Typography.Text strong className={styles.resultTitle}>
              Từ vựng nhận diện được (bấm để tra cứu):
            </Typography.Text>
            <Space wrap size={[8, 8]}>
              {words.map((term) => (
                <Button
                  key={term}
                  type="dashed"
                  onClick={() => {
                    onSelectTerm(term);
                    onClose();
                  }}
                >
                  {term}
                </Button>
              ))}
            </Space>
          </div>
        )}
      </Space>
    </Modal>
  );
};
