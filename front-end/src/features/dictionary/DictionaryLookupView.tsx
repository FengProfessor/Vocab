import React, { useState } from 'react';
import { App, Button, Card, Empty, Input, Skeleton } from 'antd';
import { CameraOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { DictionaryEntryCard } from '@/features/dictionary/components/DictionaryEntryCard';
import { DictionaryOcrModal } from '@/features/dictionary/components/DictionaryOcrModal';
import { useDictionaryLookup } from '@/hooks/dictionary/useDictionaryLookup';
import { DictionaryEntryMapper } from '@/lib/mappers/dictionaryEntryMapper';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { DictionaryEntryData } from '@/types/dictionary/DictionaryEntryData';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Academic dictionary: contextual lookup (GET /dictionary/lookup), OCR word extraction and saving to the FSRS deck.
 */
export const DictionaryLookupView: React.FC = () => {
  const { message } = App.useApp();
  const addWordToDeck = useStudyStore((state) => state.addWordToDeck);
  const certLevel = useAuthStore((state) => state.user?.targetCertLevel ?? CertLevel.B1);

  const [inputValue, setInputValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ocrOpen, setOcrOpen] = useState<boolean>(false);

  const lookup = useDictionaryLookup(searchTerm);

  const search = (term: string): void => {
    setInputValue(term);
    setSearchTerm(term.trim());
  };

  const handleAddToDeck = (entry: DictionaryEntryData): void => {
    addWordToDeck(DictionaryEntryMapper.toDeckWord(entry, certLevel));
    void message.success(`Đã thêm "${entry.term}" vào hàng đợi ôn tập FSRS v5!`);
  };

  const renderResult = (): React.ReactNode => {
    if (!searchTerm) {
      return (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nhập một từ tiếng Anh để bắt đầu tra cứu." />
        </Card>
      );
    }
    if (lookup.isLoading) {
      return (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      );
    }
    if (!lookup.data) {
      return (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`Không tìm thấy từ "${searchTerm}" trong kho từ điển.`}
          >
            <Button type="primary" onClick={() => setOcrOpen(true)}>
              Thử nhận diện từ qua ảnh (OCR)
            </Button>
          </Empty>
        </Card>
      );
    }
    return <DictionaryEntryCard entry={lookup.data} onAddToDeck={handleAddToDeck} />;
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 06 • ACADEMIC DICTIONARY"
        title="Từ Điển Học Thuật VSTEP & TOEIC"
        subtitle="Tra cứu nét nghĩa theo ngữ cảnh, collocations, IPA giọng US và nhận diện từ qua ảnh OCR."
        extra={
          <Button icon={<CameraOutlined />} onClick={() => setOcrOpen(true)}>
            Quét từ qua ảnh (OCR)
          </Button>
        }
      />

      <Card className="lp-mb-20">
        <Input.Search
          size="large"
          allowClear
          enterButton="Tra cứu"
          prefix={<SearchOutlined />}
          loading={lookup.isFetching}
          value={inputValue}
          placeholder="Nhập từ vựng tiếng Anh cần tra cứu..."
          onChange={(event) => setInputValue(event.target.value)}
          onSearch={search}
        />
      </Card>

      {renderResult()}

      <DictionaryOcrModal open={ocrOpen} onClose={() => setOcrOpen(false)} onSelectTerm={search} />
    </div>
  );
};
