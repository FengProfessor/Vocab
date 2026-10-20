import React from 'react';
import { Card, Col, Progress, Row, Space, Typography, theme } from 'antd';
import {
  BookOutlined,
  CustomerServiceOutlined,
  FontColorsOutlined,
  ReadOutlined,
} from '@ant-design/icons';

interface SkillMetric {
  key: string;
  name: string;
  percent: number;
  icon: React.ReactNode;
  color: string;
}

/**
 * Visual skill competency overview displaying progress bars for Vocabulary, Grammar, Reading, and Listening.
 */
export const StudentMasteryRadar: React.FC = () => {
  const { token } = theme.useToken();

  const skills: SkillMetric[] = [
    {
      key: 'vocab',
      name: 'Từ vựng FSRS v5',
      percent: 74,
      icon: <BookOutlined style={{ color: '#4f46e5' }} />,
      color: '#4f46e5',
    },
    {
      key: 'grammar',
      name: 'Ngữ pháp 4 Bước',
      percent: 62,
      icon: <FontColorsOutlined style={{ color: '#0284c7' }} />,
      color: '#0284c7',
    },
    {
      key: 'reading',
      name: 'Đọc hiểu Song ngữ',
      percent: 85,
      icon: <ReadOutlined style={{ color: '#10b981' }} />,
      color: '#10b981',
    },
    {
      key: 'listening',
      name: 'Nghe chép chính tả TOEIC',
      percent: 58,
      icon: <CustomerServiceOutlined style={{ color: '#f59e0b' }} />,
      color: '#f59e0b',
    },
  ];

  return (
    <Card
      title="Độ thành thạo 4 Kỹ năng Cốt lõi"
      style={{
        marginBottom: 24,
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <Row gutter={[24, 20]}>
        {skills.map((skill) => (
          <Col xs={24} sm={12} key={skill.key}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  {skill.icon}
                  <Typography.Text strong>{skill.name}</Typography.Text>
                </Space>
                <Typography.Text strong style={{ color: skill.color }}>
                  {skill.percent}%
                </Typography.Text>
              </div>
              <Progress
                percent={skill.percent}
                strokeColor={skill.color}
                showInfo={false}
                size="small"
              />
            </Space>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
