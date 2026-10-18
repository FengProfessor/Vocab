import React, { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Input,
  List,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';

/**
 * Server dictionary entry DTO returned by GET /api/v1/dictionary/lookup.
 */
interface ServerDictionaryEntryDto {
  id: string;
  term: string;
  ipa: string;
  partOfSpeech: string;
  definitionsJson: string;
  collocationsJson: string;
  synonymsJson: string;
  antonymsJson: string;
  bestContextualSenseIndex: number | null;
}

/**
 * Parsed definition sense structure inside definitionsJson.
 */
interface ParsedSenseItem {
  sense?: number;
  en: string;
  vi: string;
  example?: string;
}

const QUICK_TERMS: string[] = ['ubiquitous', 'resilient', 'mitigate', 'pragmatic'];

/**
 * Academic & TOEIC Dictionary Lookup view calling GET /api/v1/dictionary/lookup dynamically on the .NET 10 server.
 */
export const DictionaryLookupView: React.FC = () => {
  const { message } = App.useApp();
  const { addWordToDeck } = useStudyStore();
  const [searchTerm, setSearchTerm] = useState<string>('ubiquitous');
  const [inputVal, setInputVal] = useState<string>('ubiquitous');

  const lookupQuery = useQuery({
    queryKey: ['dictionary-lookup', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerDictionaryEntryDto>>(
        `/dictionary/lookup?term=${encodeURIComponent(searchTerm)}`
      );
      return response.data.data;
    },
    enabled: Boolean(searchTerm.trim()),
  });

  const entry = lookupQuery.data;

  let senses: ParsedSenseItem[] = [];
  let collocations: string[] = [];
  let synonyms: string[] = [];
  let antonyms: string[] = [];

  if (entry) {
    try {
      senses = JSON.parse(entry.definitionsJson) as ParsedSenseItem[];
    } catch {
      senses = [{ en: entry.definitionsJson, vi: entry.definitionsJson }];
    }
    try {
      collocations = JSON.parse(entry.collocationsJson) as string[];
    } catch {
      collocations = [];
    }
    try {
      synonyms = JSON.parse(entry.synonymsJson) as string[];
    } catch {
      synonyms = [];
    }
    try {
      antonyms = JSON.parse(entry.antonymsJson) as string[];
    } catch {
      antonyms = [];
    }
  }

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 06 • ACADEMIC DICTIONARY & COLLOCATION EXPLORER (DYNAMIC API)"
        title="Từ điển Học thuật, Collocations & Paraphrasing"
        subtitle="Tra cứu trực tiếp từ máy chủ .NET 10 (GET /api/v1/dictionary/lookup) với phân tích ngữ nghĩa theo ngữ cảnh."
      />

      <Card style={{ marginBottom: 20 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            size="large"
            allowClear
            enterButton="Tra cứu Server"
            prefix={<SearchOutlined />}
            placeholder="Nhập bất kỳ từ tiếng Anh nào để tra cứu từ Server (ví dụ: ubiquitous, resilient, mitigate, pragmatic)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onSearch={(val) => {
              if (val.trim()) {
                setSearchTerm(val.trim());
              }
            }}
          />
          <Space wrap>
            <Typography.Text type="secondary">Tra nhanh:</Typography.Text>
            {QUICK_TERMS.map((term) => (
              <Tag
                key={term}
                color={searchTerm.toLowerCase() === term ? 'indigo' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setInputVal(term);
                  setSearchTerm(term);
                }}
              >
                {term}
              </Tag>
            ))}
          </Space>
        </Space>
      </Card>

      {lookupQuery.isFetching ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        entry && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <Space wrap>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                      {entry.term}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                      {entry.ipa}
                    </Typography.Text>
                    <Tag color="cyan">{entry.partOfSpeech}</Tag>
                    <CertLevelTag level={CertLevel.C1} />
                  </Space>
                }
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      addWordToDeck({
                        word: entry.term,
                        phonetic: entry.ipa,
                        partOfSpeech: PartOfSpeechType.Adjective,
                        meaningVi: senses[0]?.vi ?? '',
                        definitionEn: senses[0]?.en ?? '',
                        exampleEn: senses[0]?.example ?? '',
                        exampleVi: senses[0]?.vi ?? '',
                        certLevel: CertLevel.C1,
                        audioUrl: null,
                      });
                      void message.success(`Đã thêm "${entry.term}" vào bộ thẻ FSRS v5!`);
                    }}
                  >
                    Đưa vào FSRS v5
                  </Button>
                }
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <List
                    bordered
                    dataSource={senses}
                    renderItem={(sense) => (
                      <List.Item>
                        <Space direction="vertical" size={4}>
                          <Typography.Text strong style={{ fontSize: 16, color: '#0f766e' }}>
                            {sense.vi}
                          </Typography.Text>
                          <Typography.Text>{sense.en}</Typography.Text>
                          {sense.example && (
                            <Typography.Text type="secondary" italic>
                              Ví dụ: &ldquo;{sense.example}&rdquo;
                            </Typography.Text>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />

                  <div>
                    <Typography.Text strong style={{ marginRight: 8 }}>
                      Collocations ăn điểm:
                    </Typography.Text>
                    <Space wrap>
                      {collocations.map((col) => (
                        <Tag key={col} color="geekblue">
                          {col}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  <div>
                    <Typography.Text strong style={{ marginRight: 8 }}>
                      Từ đồng nghĩa (Paraphrasing):
                    </Typography.Text>
                    <Space wrap>
                      {synonyms.map((syn) => (
                        <Tag key={syn} color="purple">
                          {syn}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  {antonyms.length > 0 && (
                    <div>
                      <Typography.Text strong style={{ marginRight: 8 }}>
                        Từ trái nghĩa (Antonyms):
                      </Typography.Text>
                      <Space wrap>
                        {antonyms.map((ant) => (
                          <Tag key={ant} color="volcano">
                            {ant}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        )
      )}
    </div>
  );
};
