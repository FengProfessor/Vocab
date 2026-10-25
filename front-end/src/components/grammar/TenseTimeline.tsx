'use client';

import React from 'react';
import { Clock, Info, CheckCircle2 } from 'lucide-react';

interface TenseTimelineProps {
  lessonTitle?: string;
  slug?: string;
  titleVi?: string;
}

interface TenseDetail {
  id: string;
  nameVi: string;
  nameEn: string;
  formula: string;
  usage: string;
  markers: string[];
  timelineSvg: (width: number, height: number) => React.ReactNode;
}

const TENSE_DATA: Record<string, TenseDetail> = {
  present_simple: {
    id: 'present_simple',
    nameVi: 'Thì Hiện tại đơn',
    nameEn: 'Present Simple Tense',
    formula: 'S + V(s/es) + O  |  S + am/is/are + N/Adj',
    usage: 'Diễn tả một thói quen, một sự thật hiển nhiên, lịch trình có sẵn hoặc trạng thái ở hiện tại.',
    markers: ['every day/week/month', 'always', 'usually', 'often', 'sometimes', 'never', 'once a week'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Repeating indicators across the line (habitual) */}
          <circle cx={w * 0.15} cy={cy} r="4" className="fill-emerald-500 opacity-60" />
          <circle cx={w * 0.3} cy={cy} r="4" className="fill-emerald-500 opacity-60" />
          <circle cx={w * 0.5} cy={cy} r="6" className="fill-emerald-500 animate-pulse" />
          <circle cx={w * 0.7} cy={cy} r="4" className="fill-emerald-500 opacity-60" />
          <circle cx={w * 0.85} cy={cy} r="4" className="fill-emerald-500 opacity-60" />
          <path d={`M ${w * 0.1} ${cy - 12} L ${w * 0.9} ${cy - 12}`} stroke="var(--color-emerald-500, #10b981)" strokeWidth="2" strokeDasharray="3,3" opacity="0.6" />
          <text x={w * 0.5} y={cy - 18} textAnchor="middle" className="text-[10px] fill-emerald-600 font-bold uppercase tracking-wider">Thói quen / Sự thật lặp lại</text>
        </g>
      );
    }
  },
  present_continuous: {
    id: 'present_continuous',
    nameVi: 'Thì Hiện tại tiếp diễn',
    nameEn: 'Present Continuous Tense',
    formula: 'S + am/is/are + V-ing + O',
    usage: 'Diễn tả hành động đang xảy ra tại thời điểm nói hoặc xung quanh thời điểm nói.',
    markers: ['now', 'at the moment', 'currently', 'at present', 'Look!', 'Listen!'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Glowing pulse right at Present */}
          <circle cx={w * 0.5} cy={cy} r="12" className="fill-blue-500/30 animate-ping" />
          <circle cx={w * 0.5} cy={cy} r="7" className="fill-blue-600 font-bold" />
          <path d={`M ${w * 0.5} ${cy} L ${w * 0.5} ${cy - 22}`} stroke="var(--color-blue-500, #3b82f6)" strokeWidth="2" />
          <text x={w * 0.5} y={cy - 28} textAnchor="middle" className="text-[10px] fill-blue-600 font-bold uppercase tracking-wider">Đang xảy ra (Now)</text>
        </g>
      );
    }
  },
  present_perfect: {
    id: 'present_perfect',
    nameVi: 'Thì Hiện tại hoàn thành',
    nameEn: 'Present Perfect Tense',
    formula: 'S + have/has + V3/ed + O',
    usage: 'Diễn tả hành động đã xảy ra trong quá khứ kéo dài đến hiện tại, hoặc để lại kết quả ở hiện tại, không rõ thời điểm.',
    markers: ['since + mốc thời gian', 'for + khoảng thời gian', 'already', 'yet', 'just', 'ever', 'never', 'so far', 'recently'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Action happened in past, linking to present */}
          <path d={`M ${w * 0.25} ${cy} C ${w * 0.35} ${cy - 20}, ${w * 0.45} ${cy - 20}, ${w * 0.5} ${cy}`} 
                fill="none" stroke="var(--color-indigo-500, #6366f1)" strokeWidth="3" markerEnd="url(#arrow)" 
                strokeDasharray="4 2" className="animate-[dash_2s_linear_infinite]" />
          <circle cx={w * 0.25} cy={cy} r="5" className="fill-indigo-400" />
          <circle cx={w * 0.5} cy={cy} r="7" className="fill-indigo-600" />
          <text x={w * 0.375} y={cy - 25} textAnchor="middle" className="text-[10px] fill-indigo-600 font-bold uppercase tracking-wider">Từ quá khứ → Hiện tại</text>
        </g>
      );
    }
  },
  present_perfect_continuous: {
    id: 'present_perfect_continuous',
    nameVi: 'Thì Hiện tại hoàn thành tiếp diễn',
    nameEn: 'Present Perfect Continuous Tense',
    formula: 'S + have/has + been + V-ing + O',
    usage: 'Diễn tả hành động bắt đầu ở quá khứ, kéo dài liên tục đến hiện tại và có thể tiếp tục ở tương lai. Nhấn mạnh tính liên tục.',
    markers: ['since', 'for', 'all morning/day/week', 'how long'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Continuous shaded connection from past to present */}
          <path d={`M ${w * 0.25} ${cy} C ${w * 0.35} ${cy - 16}, ${w * 0.45} ${cy - 16}, ${w * 0.5} ${cy}`} 
                fill="none" stroke="var(--color-violet-500, #8b5cf6)" strokeWidth="4" />
          <circle cx={w * 0.25} cy={cy} r="5" className="fill-violet-400" />
          <circle cx={w * 0.5} cy={cy} r="7" className="fill-violet-600" />
          <text x={w * 0.375} y={cy - 22} textAnchor="middle" className="text-[10px] fill-violet-600 font-bold uppercase tracking-wider">Kéo dài liên tục</text>
        </g>
      );
    }
  },
  past_simple: {
    id: 'past_simple',
    nameVi: 'Thì Quá khứ đơn',
    nameEn: 'Past Simple Tense',
    formula: 'S + V2/ed + O  |  S + was/were + N/Adj',
    usage: 'Diễn tả hành động đã xảy ra và kết thúc hoàn toàn tại một thời điểm xác định trong quá khứ.',
    markers: ['yesterday', 'ago (2 days ago...)', 'last (last night/year)', 'in + năm quá khứ (in 1999)'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Giant X in the Past zone */}
          <path d={`M ${w * 0.25 - 6} ${cy - 6} L ${w * 0.25 + 6} ${cy + 6}`} stroke="var(--color-rose-500, #f43f5e)" strokeWidth="3" />
          <path d={`M ${w * 0.25 + 6} ${cy - 6} L ${w * 0.25 - 6} ${cy + 6}`} stroke="var(--color-rose-500, #f43f5e)" strokeWidth="3" />
          <text x={w * 0.25} y={cy - 16} textAnchor="middle" className="text-[10px] fill-rose-600 font-bold uppercase tracking-wider">Đã kết thúc</text>
        </g>
      );
    }
  },
  past_continuous: {
    id: 'past_continuous',
    nameVi: 'Thì Quá khứ tiếp diễn',
    nameEn: 'Past Continuous Tense',
    formula: 'S + was/were + V-ing + O',
    usage: 'Diễn tả hành động đang diễn ra tại một thời điểm cụ thể hoặc song song với hành động khác trong quá khứ.',
    markers: ['at + giờ cụ thể + thời gian quá khứ', 'when/while/as'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Shaded wavy line in the past */}
          <path d={`M ${w * 0.2} ${cy - 5} Q ${w * 0.25} ${cy - 12}, ${w * 0.3} ${cy - 5} T ${w * 0.4} ${cy - 5}`} 
                fill="none" stroke="var(--color-amber-500, #f59e0b)" strokeWidth="3" />
          <circle cx={w * 0.3} cy={cy - 5} r="4" className="fill-amber-600 animate-pulse" />
          <text x={w * 0.3} y={cy - 18} textAnchor="middle" className="text-[10px] fill-amber-600 font-bold uppercase tracking-wider">Đang diễn ra ở QK</text>
        </g>
      );
    }
  },
  past_perfect: {
    id: 'past_perfect',
    nameVi: 'Thì Quá khứ hoàn thành',
    nameEn: 'Past Perfect Tense',
    formula: 'S + had + V3/ed + O',
    usage: 'Diễn tả hành động xảy ra trước một thời điểm hoặc trước một hành động khác trong quá khứ.',
    markers: ['before', 'after', 'by the time', 'as soon as', 'until then'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Action 1 (Past Perfect) occurs before Action 2 (Past Simple) */}
          <circle cx={w * 0.18} cy={cy} r="6" className="fill-purple-600" />
          <text x={w * 0.18} y={cy - 14} textAnchor="middle" className="text-[9px] fill-purple-600 font-bold">Hành động 1</text>
          
          <path d={`M ${w * 0.22} ${cy} L ${w * 0.32} ${cy}`} stroke="var(--color-slate-400, #94a3b8)" strokeWidth="1.5" markerEnd="url(#arrow-slate)" />
          
          <circle cx={w * 0.35} cy={cy} r="5" className="fill-rose-500" />
          <text x={w * 0.35} y={cy - 14} textAnchor="middle" className="text-[9px] fill-rose-500 font-bold">Hành động 2</text>
          
          <text x={w * 0.26} y={cy + 18} textAnchor="middle" className="text-[9px] fill-slate-500 italic">Xảy ra trước</text>
        </g>
      );
    }
  },
  past_perfect_continuous: {
    id: 'past_perfect_continuous',
    nameVi: 'Thì Quá khứ hoàn thành tiếp diễn',
    nameEn: 'Past Perfect Continuous Tense',
    formula: 'S + had + been + V-ing + O',
    usage: 'Nhấn mạnh tính liên tục của một hành động đang kéo dài trước một thời điểm hoặc hành động khác trong quá khứ.',
    markers: ['for + khoảng thời gian + before', 'since', 'until then', 'how long ... before'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          <path d={`M ${w * 0.14} ${cy - 4} Q ${w * 0.2} ${cy - 12}, ${w * 0.25} ${cy - 4} T ${w * 0.34} ${cy - 4}`}
                fill="none" stroke="var(--color-purple-500, #a855f7)" strokeWidth="2.5" />
          <circle cx={w * 0.35} cy={cy} r="5" className="fill-rose-500" />
          <text x={w * 0.24} y={cy - 16} textAnchor="middle" className="text-[9px] fill-purple-600 font-bold">Kéo dài liên tục trước mốc QK</text>
        </g>
      );
    }
  },
  future_simple: {
    id: 'future_simple',
    nameVi: 'Thì Tương lai đơn (will)',
    nameEn: 'Future Simple Tense (will)',
    formula: 'S + will + V-inf + O',
    usage: 'Diễn tả một quyết định ngay tại thời điểm nói, một dự đoán, hoặc một lời hứa/đề nghị.',
    markers: ['tomorrow', 'next week/year', 'in the future', 'I think / I promise'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Star or dot in Future zone */}
          <polygon points={`${w * 0.75},${cy - 8} ${w * 0.75 + 2},${cy - 2} ${w * 0.75 + 8},${cy - 2} ${w * 0.75 + 3},${cy + 2} ${w * 0.75 + 5},${cy + 8} ${w * 0.75},${cy + 4} ${w * 0.75 - 5},${cy + 8} ${w * 0.75 - 3},${cy + 2} ${w * 0.75 - 8},${cy - 2} ${w * 0.75 - 2},${cy - 2}`} 
                   className="fill-sky-500 animate-spin" style={{ transformOrigin: `${w * 0.75}px ${cy}px`, animationDuration: '6s' }} />
          <text x={w * 0.75} y={cy - 16} textAnchor="middle" className="text-[10px] fill-sky-600 font-bold uppercase tracking-wider">Sẽ xảy ra</text>
        </g>
      );
    }
  },
  be_going_to: {
    id: 'be_going_to',
    nameVi: 'Tương lai gần (be going to)',
    nameEn: 'Near Future (be going to)',
    formula: 'S + am/is/are + going to + V-inf + O',
    usage: 'Diễn tả kế hoạch/dự định đã quyết định từ trước lúc nói, hoặc dự đoán tương lai có dấu hiệu rõ ràng ở hiện tại.',
    markers: ['tomorrow', 'tonight', 'next week', 'Look at those clouds!'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          <circle cx={w * 0.5} cy={cy} r="4" className="fill-indigo-600" />
          <path d={`M ${w * 0.5} ${cy} L ${w * 0.72} ${cy}`} stroke="var(--color-indigo-500, #6366f1)" strokeWidth="2.5" strokeDasharray="4 2" />
          <circle cx={w * 0.74} cy={cy} r="6" className="fill-sky-600" />
          <text x={w * 0.62} y={cy - 14} textAnchor="middle" className="text-[9px] fill-indigo-600 font-bold">Dự định từ hiện tại → Sắp xảy ra</text>
        </g>
      );
    }
  },
  future_continuous: {
    id: 'future_continuous',
    nameVi: 'Thì Tương lai tiếp diễn',
    nameEn: 'Future Continuous Tense',
    formula: 'S + will + be + V-ing + O',
    usage: 'Diễn tả hành động sẽ đang diễn ra tại một thời điểm xác định cụ thể trong tương lai.',
    markers: ['at this time tomorrow', 'at 8 a.m. tomorrow', 'when + mệnh đề hiện tại đơn'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          <path d={`M ${w * 0.65} ${cy - 5} Q ${w * 0.7} ${cy - 12}, ${w * 0.75} ${cy - 5} T ${w * 0.85} ${cy - 5}`}
                fill="none" stroke="var(--color-sky-500, #0ea5e9)" strokeWidth="3" />
          <circle cx={w * 0.75} cy={cy - 5} r="4" className="fill-sky-600 animate-pulse" />
          <text x={w * 0.75} y={cy - 18} textAnchor="middle" className="text-[10px] fill-sky-600 font-bold uppercase tracking-wider">Sẽ đang diễn ra</text>
        </g>
      );
    }
  },
  future_perfect: {
    id: 'future_perfect',
    nameVi: 'Thì Tương lai hoàn thành',
    nameEn: 'Future Perfect Tense',
    formula: 'S + will have + V3/ed + O',
    usage: 'Diễn tả hành động sẽ hoàn thành trước một thời điểm hoặc trước một hành động khác trong tương lai.',
    markers: ['by + mốc thời gian (by next Monday)', 'by the time + mệnh đề hiện tại đơn'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          {/* Shaded indicator completed in future */}
          <path d={`M ${w * 0.55} ${cy} C ${w * 0.62} ${cy - 16}, ${w * 0.7} ${cy - 16}, ${w * 0.75} ${cy}`} 
                fill="none" stroke="var(--color-teal-500, #14b8a6)" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx={w * 0.75} cy={cy} r="6" className="fill-teal-600" />
          <text x={w * 0.75} y={cy - 16} textAnchor="middle" className="text-[9px] fill-teal-600 font-bold">Hoàn tất trước</text>
        </g>
      );
    }
  },
  future_in_the_past: {
    id: 'future_in_the_past',
    nameVi: 'Tương lai trong quá khứ',
    nameEn: 'Future in the Past',
    formula: 'S + would + V-inf / was/were going to + V-inf',
    usage: 'Diễn tả một dự định hoặc dự đoán về tương lai được nhìn từ một thời điểm trong quá khứ.',
    markers: ['said that ... would', 'thought ... was going to', 'promised that ... would'],
    timelineSvg: (w, h) => {
      const cy = h / 2;
      return (
        <g>
          <circle cx={w * 0.22} cy={cy} r="5" className="fill-amber-600" />
          <path d={`M ${w * 0.22} ${cy} L ${w * 0.42} ${cy}`} stroke="var(--color-amber-500, #f59e0b)" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={w * 0.42} cy={cy} r="5" className="fill-sky-600" />
          <text x={w * 0.32} y={cy - 14} textAnchor="middle" className="text-[9px] fill-amber-700 font-bold">Từ QK nhìn về tương lai</text>
        </g>
      );
    }
  }
};

/**
 * Phân tích tiêu đề bài học hoặc slug và trả về khóa của thì tương ứng (nếu khớp)
 */
function detectTense(title: string): TenseDetail | null {
  const norm = title.toLowerCase().replace(/[-_]+/g, ' ');
  
  if (norm.includes('hiện tại đơn') || norm.includes('present simple')) {
    return TENSE_DATA.present_simple;
  }
  if (norm.includes('hiện tại tiếp diễn') || norm.includes('present continuous')) {
    return TENSE_DATA.present_continuous;
  }
  if (
    norm.includes('hiện tại hoàn thành tiếp diễn') ||
    norm.includes('present perfect continuous') ||
    norm.includes('present perfect progressive')
  ) {
    return TENSE_DATA.present_perfect_continuous;
  }
  if (norm.includes('hiện tại hoàn thành') || norm.includes('present perfect')) {
    return TENSE_DATA.present_perfect;
  }
  if (
    norm.includes('quá khứ hoàn thành tiếp diễn') ||
    norm.includes('past perfect continuous') ||
    norm.includes('past perfect progressive')
  ) {
    return TENSE_DATA.past_perfect_continuous;
  }
  if (norm.includes('quá khứ hoàn thành') || norm.includes('past perfect')) {
    return TENSE_DATA.past_perfect;
  }
  if (norm.includes('quá khứ tiếp diễn') || norm.includes('past continuous')) {
    return TENSE_DATA.past_continuous;
  }
  if (norm.includes('quá khứ đơn') || norm.includes('past simple') || norm.includes('simple past')) {
    return TENSE_DATA.past_simple;
  }
  if (norm.includes('tương lai trong quá khứ') || norm.includes('future in the past')) {
    return TENSE_DATA.future_in_the_past;
  }
  if (norm.includes('tương lai hoàn thành') || norm.includes('future perfect')) {
    return TENSE_DATA.future_perfect;
  }
  if (
    norm.includes('tương lai tiếp diễn') ||
    norm.includes('future continuous') ||
    norm.includes('future progressive')
  ) {
    return TENSE_DATA.future_continuous;
  }
  if (norm.includes('tương lai gần') || norm.includes('going to')) {
    return TENSE_DATA.be_going_to;
  }
  if (
    norm.includes('tương lai đơn') ||
    norm.includes('future simple') ||
    norm.includes('simple future') ||
    norm.includes('future will')
  ) {
    return TENSE_DATA.future_simple;
  }
  
  return null;
}

export default function TenseTimeline({ lessonTitle, slug, titleVi }: TenseTimelineProps) {
  const tense = detectTense(`${lessonTitle || ''} ${titleVi || ''} ${slug || ''}`.trim());
  if (!tense) return null;

  const width = 480;
  const height = 100;
  const cy = height / 2;

  return (
    <div className="my-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 border border-border rounded-none text-primary shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h4 className="font-sans font-bold text-foreground text-base sm:text-lg leading-tight">{tense.nameVi}</h4>
            <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">{tense.nameEn}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Sơ đồ trực quan hóa dòng thời gian
          </p>
        </div>
      </div>

      {/* Responsive SVG Timeline container */}
      <div className="bg-muted/20 border border-border rounded-none p-4 sm:p-5">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          width="100%" 
          height="100%"
          className="overflow-visible"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary, #4f46e5)" />
            </marker>
            <marker id="arrow-slate" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted-foreground, #94a3b8)" />
            </marker>
          </defs>

          {/* Timeline axis */}
          <line x1="20" y1={cy} x2={width - 20} y2={cy} stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Arrow heads on timeline ends */}
          <path d={`M ${width - 15} ${cy} L ${width - 22} ${cy - 4} L ${width - 22} ${cy + 4} Z`} fill="#cbd5e1" />
          <path d={`M 15 ${cy} L 22 ${cy - 4} L 22 ${cy + 4} Z`} fill="#cbd5e1" />

          {/* Milestones */}
          {/* Past */}
          <circle cx={width * 0.25} cy={cy} r="5" fill="#94a3b8" />
          <text x={width * 0.25} y={cy + 18} textAnchor="middle" className="text-[10px] font-medium fill-muted-foreground uppercase tracking-wide">Quá khứ</text>

          {/* Present */}
          <circle cx={width * 0.5} cy={cy} r="6" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
          <text x={width * 0.5} y={cy + 18} textAnchor="middle" className="text-[10px] font-semibold fill-foreground uppercase tracking-wider">Hiện tại</text>

          {/* Future */}
          <circle cx={width * 0.75} cy={cy} r="5" fill="#94a3b8" />
          <text x={width * 0.75} y={cy + 18} textAnchor="middle" className="text-[10px] font-medium fill-muted-foreground uppercase tracking-wide">Tương lai</text>

          {/* Dynamic illustration */}
          {tense.timelineSvg(width, height)}
        </svg>
      </div>

      {/* Usage section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-muted/20 border border-border rounded-none p-4 flex gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1">Công thức chung</p>
            <code className="bg-primary/10 border border-primary/20 text-primary font-semibold px-2 py-1 rounded-none font-mono inline-block">
              {tense.formula}
            </code>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">{tense.usage}</p>
          </div>
        </div>

        <div className="bg-muted/20 border border-border rounded-none p-4 flex gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1">Dấu hiệu nhận biết</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tense.markers.map(m => (
                <span key={m} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-medium px-2 py-0.5 rounded-none text-[11px]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
