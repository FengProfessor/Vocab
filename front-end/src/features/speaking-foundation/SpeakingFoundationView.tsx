import React, { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { FoundationClarityRating } from '@/types/enums/FoundationClarityRating';
import { FoundationModalityType } from '@/types/enums/FoundationModalityType';
import { LexicalEvidenceSource } from '@/types/enums/LexicalEvidenceSource';
import { LexicalStatusBucket } from '@/types/enums/LexicalStatusBucket';
import { LexicalSupportLevel } from '@/types/enums/LexicalSupportLevel';

/**
 * Diagnostic probe DTO returned by GET /api/v1/speaking-foundation/probes.
 */
interface ServerDiagnosticProbeDto {
  id: string;
  conceptCode: string;
  headword: string;
  ipa: string;
  meaningVi: string;
  frequencyBand: number;
  certLevel: CertLevel;
}

/**
 * Speaking Foundation & Phonetic IPA Drill module fetching diagnostic probes from GET /api/v1/speaking-foundation/probes
 * and recording speaking evidence to POST /api/v1/speaking-foundation/evidence.
 */
export const SpeakingFoundationView: React.FC = () => {
  const { message } = App.useApp();
  const [modality, setModality] = useState<FoundationModalityType>(
    FoundationModalityType.Audio
  );
  const [lastClarity, setLastClarity] = useState<FoundationClarityRating>(
    FoundationClarityRating.V3
  );

  const probesQuery = useQuery({
    queryKey: ['speaking-foundation-probes'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerDiagnosticProbeDto[]>>(
        '/speaking-foundation/diagnostic/probes?maxProbes=6'
      );
      return response.data.data ?? [];
    },
  });

  const recordEvidenceMutation = useMutation({
    mutationFn: async (params: { conceptId: string; isSuccessful: boolean }) => {
      const response = await apiClient.post<ApiResponse<LexicalStatusBucket>>(
        '/speaking-foundation/evidence',
        {
          conceptId: params.conceptId,
          evidenceSource: LexicalEvidenceSource.Learner,
          supportLevel: LexicalSupportLevel.Independent,
          probeType: String(modality),
          isSuccessful: params.isSuccessful,
          responseLatencyMs: 1850,
        }
      );
      return response.data.data;
    },
    onSuccess: (bucket) => {
      void message.success(
        `Đã lưu bằng chứng phát âm lên Server (Trạng thái từ vựng: ${String(bucket).toUpperCase()})!`
      );
    },
  });

  const probes = probesQuery.data ?? [];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 10 • SPEAKING FOUNDATION & PHONETIC IPA LAB (DYNAMIC API)"
        title="Phòng Luyện Phát Âm IPA, Shadowing & Trọng Âm Câu"
        subtitle="Tải danh sách khái niệm phát âm từ GET /api/v1/speaking-foundation/probes và ghi nhận bằng chứng nói qua POST /api/v1/speaking-foundation/evidence."
        extra={
          <Space wrap>
            <Segmented<FoundationModalityType>
              value={modality}
              onChange={(val) => setModality(val)}
              options={[
                { label: 'Shadowing Nhại giọng', value: FoundationModalityType.Audio },
                { label: 'Phân biệt Âm vị', value: FoundationModalityType.Text },
                { label: 'Sắp xếp Cụm câu', value: FoundationModalityType.SyntacticFrame },
              ]}
            />
            <Button
              icon={<SyncOutlined spin={probesQuery.isFetching} />}
              onClick={() => void probesQuery.refetch()}
            >
              Tải lại từ Server
            </Button>
          </Space>
        }
      />

      {probesQuery.isLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {probes.map((probe) => (
            <Col xs={24} md={12} key={probe.id}>
              <Card
                title={
                  <Space>
                    <Typography.Text strong style={{ fontSize: 17 }}>
                      {probe.headword}
                    </Typography.Text>
                    <CertLevelTag level={probe.certLevel} />
                    <Tag color="geekblue">{probe.conceptCode}</Tag>
                  </Space>
                }
                extra={<Tag color="indigo">Band tần suất: {probe.frequencyBand}</Tag>}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 15 }}>
                    Phiên âm chuẩn IPA: <strong>{probe.ipa}</strong> — {probe.meaningVi}
                  </Typography.Text>
                  <AudioRecorder
                    promptText={`Please pronounce "${probe.headword}" in a professional sentence.`}
                    onRecordingComplete={(clarity) => {
                      setLastClarity(clarity);
                      recordEvidenceMutation.mutate({
                        conceptId: probe.id,
                        isSuccessful: clarity !== FoundationClarityRating.V1,
                      });
                    }}
                  />
                  <Typography.Text style={{ fontSize: 12 }} type="secondary">
                    Đánh giá độ rõ âm thanh gần nhất: <strong>{String(lastClarity).toUpperCase()}</strong>
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
