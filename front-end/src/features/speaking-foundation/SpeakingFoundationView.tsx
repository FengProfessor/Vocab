import React, { useRef } from 'react';
import { Button, Card, Col, Empty, Row, Skeleton } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { SpeakingProbeCard } from '@/features/speaking-foundation/components/SpeakingProbeCard';
import { useDiagnosticProbes } from '@/hooks/speaking/useDiagnosticProbes';
import { useRecordLexicalEvidence } from '@/hooks/speaking/useRecordLexicalEvidence';
import { FoundationClarityRating } from '@/types/enums/FoundationClarityRating';
import { FoundationModalityType } from '@/types/enums/FoundationModalityType';
import { ServerDiagnosticProbeDto } from '@/types/speaking/ServerDiagnosticProbeDto';

/**
 * Speaking Foundation: diagnostic pronunciation probes from the API; each shadowing attempt is saved as lexical evidence
 * with the learner's self-rated clarity and the real response latency (time since the probe was shown).
 * TODO: [Backend API Required] Text / SyntacticFrame probe modalities (only Audio shadowing is available).
 */
export const SpeakingFoundationView: React.FC = () => {
  const probesQuery = useDiagnosticProbes();
  const recordEvidence = useRecordLexicalEvidence();
  const shownAtRef = useRef<Record<string, number>>({});

  const probes = probesQuery.data ?? [];
  probes.forEach((probe) => {
    shownAtRef.current[probe.conceptId] ??= Date.now();
  });

  const handleRated = (probe: ServerDiagnosticProbeDto, clarity: FoundationClarityRating): void => {
    recordEvidence.mutate({
      conceptId: probe.conceptId,
      modality: FoundationModalityType.Audio,
      isSuccessful: clarity === FoundationClarityRating.V2 || clarity === FoundationClarityRating.V3,
      responseLatencyMs: Date.now() - (shownAtRef.current[probe.conceptId] ?? Date.now()),
    });
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 10 • SPEAKING FOUNDATION"
        title="Phòng Luyện Phát Âm IPA & Shadowing"
        subtitle="Thu âm các từ chẩn đoán, nghe lại và tự đánh giá độ rõ; kết quả được lưu để theo dõi trạng thái từ vựng."
        extra={
          <Button
            icon={<SyncOutlined spin={probesQuery.isFetching} />}
            loading={probesQuery.isFetching}
            onClick={() => void probesQuery.refetch()}
          >
            Tải lại từ Server
          </Button>
        }
      />

      {probesQuery.isLoading ? (
        <Row gutter={[20, 20]}>
          {[0, 1].map((key) => (
            <Col xs={24} md={12} key={key}>
              <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : probes.length === 0 ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có từ chẩn đoán nào cho bạn lúc này." />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {probes.map((probe) => (
            <Col xs={24} md={12} key={probe.conceptId}>
              <SpeakingProbeCard probe={probe} onRated={handleRated} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
