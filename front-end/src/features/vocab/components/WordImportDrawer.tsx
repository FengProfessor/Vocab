import React, { useState } from 'react';
import { Alert, App, Button, Drawer, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloudUploadOutlined, FileTextOutlined } from '@ant-design/icons';
import styles from '@/features/vocab/components/WordImportDrawer.module.css';
import { WordImportDrawerProps } from '@/features/vocab/types/WordImportDrawerProps';
import { VocabImportParser } from '@/lib/vocabImportParser';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';

/**
 * Bulk import drawer (legacy src/app/import): paste delimited text, validate rows, preview and commit to the deck.
 * TODO: [Backend API Required] POST /api/v1/vocab/words/import to persist imported words server-side.
 */
export const WordImportDrawer: React.FC<WordImportDrawerProps> = ({
  open,
  defaultCertLevel,
  onClose,
  onImportWords,
}) => {
  const { message } = App.useApp();
  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<VocabImportItemDto[]>([]);

  const validItems = parsedItems.filter((item) => !item.errorMessage);

  const handleParse = (): void => {
    const items = VocabImportParser.parse(rawText, defaultCertLevel);
    setParsedItems(items);
    void message.info(`Đã phân tích ${items.length} dòng dữ liệu.`);
  };

  const handleCommit = (): void => {
    if (validItems.length === 0) {
      void message.warning('Chưa có từ vựng hợp lệ nào để nhập.');
      return;
    }
    onImportWords(validItems);
    void message.success(`Đã thêm ${validItems.length} từ vào bộ thẻ ôn tập!`);
    setRawText('');
    setParsedItems([]);
    onClose();
  };

  const columns: ColumnsType<VocabImportItemDto> = [
    {
      title: 'Từ vựng',
      dataIndex: 'word',
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text || '—'}</Typography.Text>
          {record.errorMessage ? (
            <Tag color="red">{record.errorMessage}</Tag>
          ) : (
            <Tag color="blue">{record.partOfSpeech}</Tag>
          )}
        </Space>
      ),
    },
    { title: 'Nghĩa tiếng Việt', dataIndex: 'meaningVi' },
    { title: 'Ví dụ ngữ cảnh', dataIndex: 'exampleEn', ellipsis: true },
  ];

  return (
    <Drawer
      title="Nhập từ vựng hàng loạt (CSV / Văn bản)"
      open={open}
      onClose={onClose}
      width={680}
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={validItems.length === 0}
            onClick={handleCommit}
          >
            Nhập vào Bộ thẻ
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <Alert
          type="info"
          showIcon
          message="Mỗi dòng: Từ vựng, Loại từ, Nghĩa tiếng Việt, Câu ví dụ (tùy chọn)"
          description="Phân cách bằng dấu phẩy, chấm phẩy, tab hoặc dấu gạch đứng (|)."
        />

        <div>
          <Typography.Text strong className={styles.field}>
            Dán nội dung từ vựng:
          </Typography.Text>
          <Input.TextArea
            rows={6}
            value={rawText}
            placeholder="ubiquitous, adj, phổ biến khắp nơi, Smartphones are ubiquitous."
            onChange={(event) => setRawText(event.target.value)}
          />
        </div>

        <div className={styles.parseRow}>
          <Button icon={<FileTextOutlined />} disabled={!rawText.trim()} onClick={handleParse}>
            Kiểm tra & Phân tích cấu trúc
          </Button>
        </div>

        {parsedItems.length > 0 && (
          <div>
            <Typography.Text strong className={styles.previewTitle}>
              Xem trước ({validItems.length}/{parsedItems.length} dòng hợp lệ):
            </Typography.Text>
            <Table<VocabImportItemDto>
              size="small"
              rowKey="key"
              columns={columns}
              dataSource={parsedItems}
              pagination={{ pageSize: 5 }}
            />
          </div>
        )}
      </Space>
    </Drawer>
  );
};
