import { ClassroomApi } from '@/features/classroom/api';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import type {
  FoundationLexicalConcept,
  LexicalState,
  StatusBucket,
  VocabularyGapType,
} from '@/lib/foundation-curriculum/types';

interface VocabularyMapItem {
  concept: FoundationLexicalConcept;
  state: LexicalState;
}

interface TeacherVocabularyGapMapProps {
  learnerId: string;
  learnerName?: string;
  currentLessonId?: string;
}

export default function TeacherVocabularyGapMap({
  learnerId,
  learnerName = 'Học sinh lớp 6',
  currentLessonId = '001',
}: TeacherVocabularyGapMapProps) {
  const [items, setItems] = useState<VocabularyMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VocabularyMapItem | null>(null);
  const [filterBucket, setFilterBucket] = useState<StatusBucket | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ClassroomApi.getVocabularyGapMap(`/api/foundation/vocabulary-map?learner_id=${learnerId}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || 'Không tải được bản đồ từ vựng');
      }
    } catch {
      setError('Lỗi kết nối khi tải bản đồ từ vựng');
    } finally {
      setIsLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    let active = true;
    ClassroomApi.getVocabularyGapMap(`/api/foundation/vocabulary-map?learner_id=${learnerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success) {
          setItems(data.items || []);
        } else {
          setError(data.error || 'Không tải được bản đồ từ vựng');
        }
      })
      .catch(() => {
        if (!active) return;
        setError('Lỗi kết nối khi tải bản đồ từ vựng');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [learnerId]);

  // Barometer counts
  const stats = useMemo(() => {
    const total = items.length;
    const solid = items.filter((i) => i.state.status_bucket === 'SOLID').length;
    const partial = items.filter((i) => i.state.status_bucket === 'PARTIAL').length;
    const unknown = items.filter((i) => i.state.status_bucket === 'UNKNOWN').length;
    const uncertain = items.filter((i) => i.state.status_bucket === 'UNCERTAIN').length;
    const recheck = items.filter((i) => i.state.status_bucket === 'RECHECK').length;

    return { total, solid, partial, unknown, uncertain, recheck };
  }, [items]);

  // Primary diagnostic signal
  const diagnosticSignal = useMemo(() => {
    if (items.length === 0) return null;
    const schoolNouns = items.filter((i) => i.concept.cluster === 'school_nouns');
    const coreVerbs = items.filter((i) => i.concept.cluster === 'core_verbs');

    const solidNouns = schoolNouns.filter((i) => i.state.status_bucket === 'SOLID').length;
    const solidVerbs = coreVerbs.filter((i) => i.state.status_bucket === 'SOLID').length;

    const nounRate = schoolNouns.length > 0 ? Math.round((solidNouns / schoolNouns.length) * 100) : 0;
    const verbRate = coreVerbs.length > 0 ? Math.round((solidVerbs / coreVerbs.length) * 100) : 0;

    if (nounRate >= 50 && verbRate <= 25) {
      return {
        type: 'warning',
        text: `Lệch chức năng: ${nounRate}% danh từ trường học đã vững, nhưng chỉ ${verbRate}% động từ hành động được kích hoạt. Trẻ sẽ bị nghẽn khi ghép câu vì thiếu động từ!`,
      };
    }

    const soundGapCount = items.filter((i) => i.state.active_gap === 'SOUND_FORM_GAP').length;
    if (soundGapCount >= 2) {
      return {
        type: 'info',
        text: `Hội chứng đọc tốt - nghe yếu (Sound-Form Gap): Có ${soundGapCount} từ học sinh nhận diện mặt chữ nhanh hơn nghe âm thanh do ảnh hưởng phụ âm đuôi tiếng Việt.`,
      };
    }

    return null;
  }, [items]);

  // Group items by cluster
  const clusters = useMemo(() => {
    const map = new Map<string, VocabularyMapItem[]>();
    for (const item of items) {
      if (filterBucket !== 'ALL' && item.state.status_bucket !== filterBucket) {
        continue;
      }
      const list = map.get(item.concept.cluster) || [];
      list.push(item);
      map.set(item.concept.cluster, list);
    }
    return map;
  }, [items, filterBucket]);

  const getClusterTitle = (cluster: string) => {
    switch (cluster) {
      case 'core_verbs':
        return 'Động từ hành động cốt lõi (Core Action Verbs)';
      case 'school_nouns':
        return 'Đồ dùng học tập & Lớp học (School Nouns)';
      case 'food_drink':
        return 'Thức ăn & Đồ uống (Food & Drink)';
      case 'states_emotions':
        return 'Trạng thái & Cảm xúc (States & Emotions)';
      default:
        return cluster.replace('_', ' ').toUpperCase();
    }
  };

  const getBucketBadge = (bucket: StatusBucket) => {
    switch (bucket) {
      case 'SOLID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Vững vàng (Solid)
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Một phần (Partial)
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            ○ Chưa học (Unknown)
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" /> Cần đo thêm (Uncertain)
          </span>
        );
      case 'RECHECK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Kiểm tra lại (Recheck)
          </span>
        );
    }
  };

  const formatGapName = (gap: VocabularyGapType) => {
    switch (gap) {
      case 'SOUND_FORM_GAP':
        return 'Lệch Âm-Chữ (Nhìn hiểu, Nghe chưa kịp)';
      case 'ORTHOGRAPHIC_FORM_GAP':
        return 'Lệch Chữ-Âm (Nghe hiểu, Chữ chưa nhớ)';
      case 'ENGLISH_FORM_RECALL_GAP':
        return 'Lệch Thụ động - Chủ động (Chưa tự nhớ ra từ)';
      case 'CHUNK_USAGE_GAP':
        return 'Lệch Từ đơn - Câu (Đứng riêng nhớ, vào câu đơ)';
      case 'MEANING_RECALL_GAP':
        return 'Mơ hồ ranh giới nghĩa (Nhầm bút mực/chì)';
      case 'CONTEXT_TRANSFER_GAP':
        return 'Lệch chuyển giao bối cảnh (Đổi hình là quên)';
      case 'RETENTION_GAP':
        return 'Quên sau ngắt quãng (Cần ôn ngắt quãng)';
      case 'POSSIBLE_VISUAL_ITEM_ERROR':
        return 'Nghi vấn lỗi hình ảnh (Không trừ điểm)';
      case 'POSSIBLE_TASK_CONFUSION':
        return 'Nghi vấn ngợp thao tác / Bối rối UI';
      default:
        return 'Chưa xác định';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Bản đồ khoảng trống từ vựng (Layer B)
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {learnerName} <span className="text-slate-400 font-normal">| Học sinh lớp 6</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bài đang học: Bài {currentLessonId} • Mục tiêu: Nhận diện lỗ hổng chính xác theo 8 chiều năng lực
            </p>
          </div>
          <button
            onClick={loadData}
            className="self-start md:self-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Làm mới dữ liệu
          </button>
        </div>

        {/* Rapid Scanning Barometer */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Thước đo trực quan (Thiết kế cho quét nhanh - Designed for Rapid Scanning)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setFilterBucket(filterBucket === 'SOLID' ? 'ALL' : 'SOLID')}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterBucket === 'SOLID'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">● Vững vàng (Solid)</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.solid} từ</div>
              <div className="text-xs text-emerald-600 mt-0.5">
                {stats.total > 0 ? Math.round((stats.solid / stats.total) * 100) : 0}% tổng số
              </div>
            </button>

            <button
              onClick={() => setFilterBucket(filterBucket === 'PARTIAL' ? 'ALL' : 'PARTIAL')}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterBucket === 'PARTIAL'
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">◐ Lệch mảng (Partial)</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{stats.partial} từ</div>
              <div className="text-xs text-amber-600 mt-0.5">
                {stats.total > 0 ? Math.round((stats.partial / stats.total) * 100) : 0}% tổng số
              </div>
            </button>

            <button
              onClick={() => setFilterBucket(filterBucket === 'UNKNOWN' ? 'ALL' : 'UNKNOWN')}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterBucket === 'UNKNOWN'
                  ? 'border-slate-500 bg-slate-100 ring-2 ring-slate-300'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">○ Chưa biết (Unknown)</div>
              <div className="text-2xl font-bold text-slate-700 mt-1">{stats.unknown} từ</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {stats.total > 0 ? Math.round((stats.unknown / stats.total) * 100) : 0}% tổng số
              </div>
            </button>

            <button
              onClick={() => setFilterBucket(filterBucket === 'UNCERTAIN' ? 'ALL' : 'UNCERTAIN')}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterBucket === 'UNCERTAIN'
                  ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
                  : 'border-slate-200 bg-white hover:border-sky-300'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">? Cần đo thêm</div>
              <div className="text-2xl font-bold text-sky-700 mt-1">{stats.uncertain} từ</div>
              <div className="text-xs text-sky-600 mt-0.5">
                {stats.total > 0 ? Math.round((stats.uncertain / stats.total) * 100) : 0}% tổng số
              </div>
            </button>

            <button
              onClick={() => setFilterBucket(filterBucket === 'RECHECK' ? 'ALL' : 'RECHECK')}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterBucket === 'RECHECK'
                  ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
                  : 'border-slate-200 bg-white hover:border-rose-300'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">⚠️ Kiểm tra lại</div>
              <div className="text-2xl font-bold text-rose-700 mt-1">{stats.recheck} từ</div>
              <div className="text-xs text-rose-600 mt-0.5">Nghi vấn lỗi thẻ/thao tác</div>
            </button>
          </div>
        </div>

        {/* Primary Diagnostic Signal Alert */}
        {diagnosticSignal && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Tín hiệu sư phạm cảnh báo (Primary Diagnostic Signal)
              </div>
              <p className="text-sm text-amber-900 mt-0.5">{diagnosticSignal.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Tables */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Đang tải ma trận năng lực...</div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(clusters.entries()).map(([clusterKey, clusterItems]) => (
            <div key={clusterKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">{getClusterTitle(clusterKey)}</h2>
                <span className="text-xs font-semibold text-slate-500">
                  {clusterItems.length} từ
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-white uppercase">
                      <th className="px-6 py-3">Từ vựng & IPA</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Âm</th>
                      <th className="px-3 py-3 text-center">Chữ</th>
                      <th className="px-3 py-3 text-center">Nghĩa</th>
                      <th className="px-3 py-3 text-center">Gọi từ</th>
                      <th className="px-3 py-3 text-center">Ghép câu</th>
                      <th className="px-6 py-3">Khoảng trống đã chẩn đoán</th>
                      <th className="px-4 py-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {clusterItems.map((item) => (
                      <tr
                        key={item.concept.id}
                        onClick={() => setSelectedItem(item)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {item.concept.lemma}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {item.concept.ipa} • {item.concept.meaning_vi}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{getBucketBadge(item.state.status_bucket)}</td>
                        <td className="px-3 py-3.5 text-center">
                          {item.state.sound_recognition ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {item.state.text_recognition ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {item.state.meaning_recall ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {item.state.form_recall ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {item.state.chunk_use ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✗</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="text-xs text-slate-700 font-medium">
                            {formatGapName(item.state.active_gap)}
                          </div>
                          {item.state.last_latency_ms > 0 && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Tốc độ: {item.state.last_latency_ms}ms • Hỗ trợ: {item.state.last_support_level}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-400 group-hover:text-indigo-600">
                          <ChevronRight className="w-5 h-5 inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deep-Dive Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Mã khái niệm: {selectedItem.concept.id}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {selectedItem.concept.lemma}{' '}
                  <span className="text-base text-slate-400 font-normal font-mono">
                    {selectedItem.concept.ipa}
                  </span>
                </h3>
                <div className="text-sm text-slate-600 mt-0.5">
                  Nghĩa: <span className="font-semibold">{selectedItem.concept.meaning_vi}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Status and Active Gap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Trạng thái tổng thể</div>
                  <div className="mt-1">{getBucketBadge(selectedItem.state.status_bucket)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Độ tin cậy (Uncertainty)</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {Math.round((1 - selectedItem.state.uncertainty_score) * 100)}% chắc chắn
                  </div>
                </div>
              </div>

              {/* 8 Dimensional Breakdown */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Phân rã 8 chiều năng lực (Dimensional Breakdown)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Nhận diện Âm thanh:</span>
                    <span className={selectedItem.state.sound_recognition ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.sound_recognition ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Nhận diện Chữ viết:</span>
                    <span className={selectedItem.state.text_recognition ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.text_recognition ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Truy xuất Nghĩa:</span>
                    <span className={selectedItem.state.meaning_recall ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.meaning_recall ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Tự nhớ Từ tiếng Anh:</span>
                    <span className={selectedItem.state.form_recall ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.form_recall ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Ghép vào Chunk:</span>
                    <span className={selectedItem.state.chunk_use ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.chunk_use ? '✓ Đạt' : '✗ Chưa'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-slate-600">Bền vững qua 7 ngày:</span>
                    <span className={selectedItem.state.retention_stable ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {selectedItem.state.retention_stable ? '✓ Bền' : '✗ Chưa thử'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chunks and Contrast Set */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-2">
                <div>
                  <span className="font-bold">Mẫu câu neo (Target Chunks):</span>{' '}
                  {selectedItem.concept.target_chunks.join(' • ') || 'Chưa định nghĩa'}
                </div>
                <div>
                  <span className="font-bold">Cặp đối lập ranh giới nghĩa:</span>{' '}
                  {selectedItem.concept.contrast_concepts.join(' • ') || 'Không có'}
                </div>
              </div>

              {/* Prescriptive Remediation */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="font-bold uppercase tracking-wider mb-1">Khuyến nghị cho giáo viên:</div>
                <p>
                  {selectedItem.state.status_bucket === 'SOLID'
                    ? 'KHÔNG CẦN DẠY LẠI. Từ này học sinh đã nhớ cả âm, chữ, và ghép câu tự nhiên. Dùng làm từ mẫu để dạy các mẫu câu mới.'
                    : selectedItem.state.active_gap === 'SOUND_FORM_GAP'
                    ? 'Luyện âm đuôi (coda stop): Học sinh nhìn chữ hiểu ngay nhưng nghe âm thanh thì không bắt kịp. Cần tập phản xạ nghe tách âm.'
                    : selectedItem.state.active_gap === 'CHUNK_USAGE_GAP'
                    ? 'Luyện ghép câu: Học sinh đọc từ đơn lẻ tốt nhưng khi đưa vào câu bị ngập ngừng. Dùng bài tập kéo thả thẻ từ.'
                    : 'Giới thiệu nhẹ nhàng qua ngữ cảnh và hình ảnh trực quan, không bắt dịch máy móc.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
