import React from 'react';
import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from '@/components/ui/Primitives';
import { PlusOutlined, SoundOutlined } from '@/components/ui/Icons';
import styles from '@/features/dictionary/components/DictionaryEntryCard.module.css';
import { DictionaryEntryCardProps } from '@/features/dictionary/types/DictionaryEntryCardProps';
import { SpeechService } from '@/lib/speechService';

/** Related-word groups rendered below the senses. */
const RELATED_GROUPS = [
  { key: 'collocations', title: 'Cụm kết hợp (Collocations)', color: 'blue' },
  { key: 'synonyms', title: 'Từ đồng nghĩa (Synonyms)', color: 'green' },
  { key: 'antonyms', title: 'Từ trái nghĩa (Antonyms)', color: 'orange' },
] as const;

/**
 * Dictionary definition card: pronunciation, senses with examples, collocations, synonyms and antonyms.
 */
export const DictionaryEntryCard: React.FC<DictionaryEntryCardProps> = ({ entry, onAddToDeck }) => {
  return (
    <Card className={styles.card}>
      <div className="lp-row-between">
        <div>
          <Space size={12} align="center">
            <Typography.Title level={2} className={styles.headword}>
              {entry.term}
            </Typography.Title>
            <Button
              shape="circle"
              icon={<SoundOutlined />}
              title="Phát âm tiếng Anh (US)"
              onClick={() => SpeechService.speak(entry.term)}
            />
            <Tag color="cyan">{entry.partOfSpeech.toUpperCase()}</Tag>
          </Space>
          {entry.ipa && (
            <Typography.Text type="secondary" className={styles.ipa}>
              {entry.ipa}
            </Typography.Text>
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onAddToDeck(entry)}>
          Thêm vào Ôn tập FSRS v5
        </Button>
      </div>

      <Divider className={styles.divider} />

      <Typography.Title level={4} className={styles.sectionTitle}>
        Các nét nghĩa:
      </Typography.Title>
      <Space direction="vertical" size={14} className="lp-full-width">
        {entry.senses.map((sense, index) => (
          <div key={`${sense.vi}-${index}`} className={styles.sense}>
            <Typography.Text strong className={styles.senseVi}>
              {index + 1}. {sense.vi}
            </Typography.Text>
            <Typography.Text className={styles.senseEn}>{sense.en}</Typography.Text>
            {sense.example && (
              <div className={`lp-quote ${styles.example}`}>
                <em>&ldquo;{sense.example}&rdquo;</em>
              </div>
            )}
          </div>
        ))}
      </Space>

      <Row gutter={[20, 20]} className={styles.groups}>
        {RELATED_GROUPS.map((group) => {
          const items = entry[group.key];
          return items.length > 0 ? (
            <Col xs={24} md={8} key={group.key}>
              <Card size="small" title={group.title}>
                <Space wrap size={[6, 8]}>
                  {items.map((item) => (
                    <Tag key={item} color={group.color}>
                      {item}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
          ) : null;
        })}
      </Row>
    </Card>
  );
};
