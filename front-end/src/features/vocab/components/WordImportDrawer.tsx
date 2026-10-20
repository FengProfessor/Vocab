import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Drawer,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloudUploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';

interface WordImportDrawerProps {
  /** Whether the import drawer is open. */
  open: boolean;
  /** Callback to close drawer. */
  onClose: () => void;
  /** Callback to push parsed words into active study deck. */
  onImportWords: (items: VocabImportItemDto[]) => void;
}

const DEFAULT_SAMPLE = `ubiquitous, adj, phổ biến khắp nơi, Smartphones have become ubiquitous in modern life.
mitigate, verb, làm dịu bớt, The government took steps to mitigate the crisis.
paradigm, noun, mô hình chuẩn, This discovery prompted a new paradigm in physics.`;

/**
 * Bulk vocabulary import drawer allowing users to paste CSV or delimited text,
 * validate rows instantly, preview parsed items, and commit them to the study store.
 */
export const WordImportDrawer: React.FC<WordImportDrawerProps> = ({
  open,
  onClose,
  onImportWords,
}) => {
  const { message } = App.useApp();
  const [rawText, setRawText] = useState<string>(DEFAULT_SAMPLE);
  const [parsedItems, setParsedItems] = useState<VocabImportItemDto[]>([]);

  const handleParse = (): void => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const results: VocabImportItemDto[] = [];

    lines.forEach((line, index) => {
      // Split by comma, tab, or pipe
      const parts = line.split(/[,|\t]/).map((p) => p.trim());
      if (parts.length >= 3) {
        const rawPos = parts[1].toLowerCase();
        let normalizedPos: PartOfSpeechType = PartOfSpeechType.Noun;
        if (rawPos.includes('verb') || rawPos === 'v') normalizedPos = PartOfSpeechType.Verb;
        else if (rawPos.includes('adj') || rawPos === 'a') normalizedPos = PartOfSpeechType.Adjective;
        else if (rawPos.includes('adv')) normalizedPos = PartOfSpeechType.Adverb;

        results.push({
          key: `import-${index}`,
          word: parts[0],
          partOfSpeech: normalizedPos,
          meaningVi: parts[2],
          exampleEn: parts[3] ?? '',
          phonetic: '/.../',
          certLevel: CertLevel.B2,
        });
      } else {
        results.push({
          key: `import-${index}`,
          word: parts[0] ?? '(Trống)',
          partOfSpeech: PartOfSpeechType.Noun,
          meaningVi: '',
          phonetic: '',
          certLevel: CertLevel.B2,
          errorMessage: 'Thiếu cột nghĩa hoặc loại từ',
        });
      }
    });

    setParsedItems(results);
    void message.info(`Đã phân tích ${results.length} dòng dữ liệu.`);
  };

  const handleCommitImport = (): void => {
    const validItems = parsedItems.filter((item) => !item.errorMessage && item.word && item.meaningVi);
    if (validItems.length === 0) {
      void message.warning('Chưa có từ vựng hợp lệ nào để nhập.');
      return;
    }

    onImportWords(validItems);
    void message.success(`Đã thêm thành công ${validItems.length} từ vào bộ thẻ ôn tập!`);
    onClose();
  };

  const columns: ColumnsType<VocabImportItemDto> = [
    {
      title: 'Từ vựng',
      dataIndex: 'word',
      key: 'word',
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text}</Typography.Text>
          {record.errorMessage ? (
            <Tag color="red">{record.errorMessage}</Tag>
          ) : (
            <Tag color="blue">{record.partOfSpeech}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Nghĩa tiếng Việt',
      dataIndex: 'meaningVi',
      key: 'meaningVi',
    },
    {
      title: 'Ví dụ ngữ cảnh',
      dataIndex: 'exampleEn',
      key: 'exampleEn',
      ellipsis: true,
    },
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
            onClick={handleCommitImport}
            disabled={parsedItems.length === 0}
          >
            Nhập vào Bộ thẻ
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Cấu trúc mỗi dòng: Từ vựng, Loại từ, Nghĩa tiếng Việt, Câu ví dụ (tùy chọn)"
          description="Hỗ trợ phân cách bằng dấu phẩy (,), dấu chấm phẩy (;), tab hoặc dấu gạch đứng (|)."
        />

        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
            Dán nội dung từ vựng:
          </Typography.Text>
          <Input.TextArea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="paste your csv or text here..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={<FileTextOutlined />} onClick={handleParse}>
            Kiểm tra & Phân tích cấu trúc
          </Button>
        </div>

        {parsedItems.length > 0 && (
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Xem trước danh sách ({parsedItems.length} từ đã nhận diện):
            </Typography.Text>
            <Table<VocabImportItemDto>
              size="small"
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
