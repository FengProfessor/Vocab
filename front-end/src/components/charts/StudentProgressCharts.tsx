'use client';

import { useSyncExternalStore } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

function useIsMobile(breakpoint = 640) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false),
    () => false
  );
}

export function StudentVmsLineChart({
  data,
}: {
  data: { date: string; vms: number; lcs: number }[];
}) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#666' }}
          interval={isMobile ? 4 : (data.length > 15 ? 2 : 'preserveStartEnd')}
        />
        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#666' }} />
        <Tooltip
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        />
        <Line type="monotone" dataKey="vms" name="Độ bền trí nhớ (VMS)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="lcs" name="Độ chăm chỉ (LCS)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StudentQuizBarChart({
  data,
}: {
  data: { date: string; acc: number }[];
}) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#666' }}
          interval={isMobile ? 3 : 'preserveStartEnd'}
        />
        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#666' }} />
        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
        <Bar dataKey="acc" name="Tỷ lệ chính xác (%)" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={isMobile ? 18 : 30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StudentCompetencyRadarChart({
  data,
}: {
  data: { subject: string; score: number; fullMark: number }[];
}) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius={isMobile ? '58%' : '75%'}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b', fontWeight: 600 }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Năng lực" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export const StudentRadarChart = StudentCompetencyRadarChart;
