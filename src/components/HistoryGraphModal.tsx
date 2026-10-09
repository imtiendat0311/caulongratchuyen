'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  X,
  Users,
  DollarSign,
  User,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { HistoryItem } from '@/types';
import { SimpleGraph, GraphDataPoint } from './SimpleGraph';

export type MetricType = 'total' | 'men' | 'women' | 'players';

interface HistoryGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  currentSessionData?: {
    totalCost: number;
    costPerMale: number;
    costPerFemale: number;
    maleCount: number;
    femaleCount: number;
    date: string;
    courtName?: string;
    hostName?: string;
  };
}

// Sample fallback sessions if user hasn't recorded history yet
const SAMPLE_SESSIONS: HistoryItem[] = [
  {
    id: 'sample-1',
    date: '2026-09-18',
    totalCost: 520000,
    costPerMale: 105000,
    costPerFemale: 79000,
    maleCount: 4,
    femaleCount: 2,
    courtCost: 400000,
    shuttleCost: 80000,
    waterCost: 40000,
    notes: 'Khai xuân sân Quán Thánh',
    courtName: 'NTĐ Quán Thánh',
    hostName: 'Nguyên'
  },
  {
    id: 'sample-2',
    date: '2026-09-22',
    totalCost: 580000,
    costPerMale: 110000,
    costPerFemale: 83000,
    maleCount: 4,
    femaleCount: 3,
    courtCost: 440000,
    shuttleCost: 90000,
    waterCost: 50000,
    notes: 'Trận giao hữu',
    courtName: 'NTĐ Quán Thánh',
    hostName: 'Đạt'
  },
  {
    id: 'sample-3',
    date: '2026-09-27',
    totalCost: 650000,
    costPerMale: 125000,
    costPerFemale: 94000,
    maleCount: 4,
    femaleCount: 2,
    courtCost: 520000,
    shuttleCost: 90000,
    waterCost: 40000,
    notes: 'Kèo cuối tháng',
    courtName: 'NTĐ Quán Thánh',
    hostName: 'Huy'
  },
  {
    id: 'sample-4',
    date: '2026-10-02',
    totalCost: 610000,
    costPerMale: 115000,
    costPerFemale: 86000,
    maleCount: 5,
    femaleCount: 2,
    courtCost: 480000,
    shuttleCost: 90000,
    waterCost: 40000,
    notes: 'Đông đủ thành viên',
    courtName: 'NTĐ Quán Thánh',
    hostName: 'Nguyên'
  },
  {
    id: 'sample-5',
    date: '2026-10-06',
    totalCost: 682000,
    costPerMale: 128000,
    costPerFemale: 96000,
    maleCount: 4,
    femaleCount: 2,
    courtCost: 520000,
    shuttleCost: 112000,
    waterCost: 50000,
    notes: 'Buổi chơi hôm nay',
    courtName: 'NTĐ Quán Thánh',
    hostName: 'Nguyên'
  }
];

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  title?: string;
  activeColor?: string;
}

function ToggleSwitch({
  label,
  checked,
  onChange,
  title,
  activeColor = '#10B981'
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer border shadow-2xs select-none ${
        checked
          ? 'bg-[var(--card)] text-[var(--text)] border-[var(--border)]'
          : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--card)]/60'
      }`}
      title={title}
    >
      <span>{label}</span>
      {/* Animated Switch Track & Knob */}
      <div
        className="w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0"
        style={{
          backgroundColor: checked ? activeColor : 'var(--border)'
        }}
      >
        <motion.div
          className="w-3 h-3 rounded-full bg-white shadow-xs"
          animate={{ x: checked ? 12 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

export function HistoryGraphModal({
  isOpen,
  onClose,
  history,
  currentSessionData
}: HistoryGraphModalProps) {
  const [metric, setMetric] = useState<MetricType>('total');
  const [curved, setCurved] = useState(true);
  const [gradientFade, setGradientFade] = useState(true);
  const [calcPercent, setCalcPercent] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);

  // Combine history items or sample items chronologically
  const activeItems: HistoryItem[] = useMemo(() => {
    if (useSampleData || (!history || history.length < 2)) {
      if (history && history.length >= 2 && !useSampleData) {
        return [...history].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      }
      return SAMPLE_SESSIONS;
    }
    return [...history].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [history, useSampleData]);

  const hasRealHistory = history && history.length >= 2;

  // Format date helper (YYYY-MM-DD -> DD/MM)
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  // Convert items into GraphDataPoint[] based on selected metric
  const graphData: GraphDataPoint[] = useMemo(() => {
    return activeItems.map((item, idx) => {
      const dLabel = formatDateLabel(item.date);
      const totalPlayers = (item.maleCount || 0) + (item.femaleCount || 0);

      switch (metric) {
        case 'total':
          return {
            value: item.totalCost || 0,
            label: dLabel,
            subLabel: `${totalPlayers} người`,
            formattedValue: `${(item.totalCost || 0).toLocaleString()}đ`
          };
        case 'men':
          return {
            value: item.costPerMale || 0,
            label: dLabel,
            subLabel: `${item.maleCount || 0} Nam`,
            formattedValue: `${(item.costPerMale || 0).toLocaleString()}đ`
          };
        case 'women':
          return {
            value: item.costPerFemale || 0,
            label: dLabel,
            subLabel: `${item.femaleCount || 0} Nữ`,
            formattedValue: `${(item.costPerFemale || 0).toLocaleString()}đ`
          };
        case 'players':
          return {
            value: totalPlayers,
            label: dLabel,
            subLabel: `${item.maleCount || 0}N · ${item.femaleCount || 0}F`,
            formattedValue: `${totalPlayers} người`
          };
      }
    });
  }, [activeItems, metric]);

  // Statistics calculation for the active metric
  const stats = useMemo(() => {
    if (graphData.length === 0) {
      return { latest: 0, avg: 0, min: 0, max: 0, change: 0 };
    }
    const values = graphData.map((d) => d.value);
    const latest = values[values.length - 1];
    const prev = values.length > 1 ? values[values.length - 2] : latest;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const change = prev !== 0 ? ((latest - prev) / prev) * 100 : 0;

    return { latest, avg, min, max, change };
  }, [graphData]);

  // Theme styling for each metric
  const metricConfig = {
    total: {
      title: 'Tổng Chi Phí (Total)',
      shortTitle: 'Tổng tiền',
      color: '#10B981', // emerald-500
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: DollarSign,
      format: (val: number) => `${Math.round(val).toLocaleString()}đ`,
      description: 'Tổng số tiền sân, cầu và nước uống thanh toán sau mỗi buổi'
    },
    men: {
      title: 'Tiền Nam (Men)',
      shortTitle: 'Tiền Nam',
      color: '#3B82F6', // blue-500
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: User,
      format: (val: number) => `${Math.round(val).toLocaleString()}đ`,
      description: 'Đơn giá chia cho mỗi thành viên Nam theo tỷ lệ chuẩn'
    },
    women: {
      title: 'Tiền Nữ (Women)',
      shortTitle: 'Tiền Nữ',
      color: '#EC4899', // pink-500
      badgeBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      icon: User,
      format: (val: number) => `${Math.round(val).toLocaleString()}đ`,
      description: 'Đơn giá chia cho mỗi thành viên Nữ (thường bằng 75% giá Nam)'
    },
    players: {
      title: 'Số Lượng Người (# Players)',
      shortTitle: 'Số người',
      color: '#8B5CF6', // purple-500
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: Users,
      format: (val: number) => `${val} người`,
      description: 'Tổng số người tham gia thi đấu (bao gồm cả Nam và Nữ)'
    }
  }[metric];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] text-[var(--text)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: metricConfig.color }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text)]">
                    Biểu Đồ Lịch Sử Chi Phí
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)]">
                    Graph
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] line-clamp-1">
                  {metricConfig.description}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
              title="Đóng biểu đồ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Metric Segmented Tabs (Total / Men / Women / # of players) with sliding switch animation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] relative">
              {(
                [
                  { id: 'total', label: '💰 Tổng tiền', color: '#10B981' },
                  { id: 'men', label: '👨 Tiền Nam', color: '#3B82F6' },
                  { id: 'women', label: '👩 Tiền Nữ', color: '#EC4899' },
                  { id: 'players', label: '👥 Số người', color: '#8B5CF6' }
                ] as const
              ).map((tab) => {
                const isActive = metric === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMetric(tab.id)}
                    className="relative py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 z-1 select-none"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeMetricTab"
                        className="absolute inset-0 bg-[var(--card)] rounded-xl shadow-xs border border-[var(--border)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span
                      className="relative z-2 w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                      style={{
                        backgroundColor: tab.color,
                        boxShadow: isActive ? `0 0 8px ${tab.color}` : 'none',
                        transform: isActive ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                    <span
                      className={`relative z-2 truncate transition-colors ${
                        isActive ? 'text-[var(--text)] font-bold' : 'text-[var(--muted)]'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[11px] font-medium text-[var(--muted)] block mb-1">
                  Buổi gần nhất
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${metric}-latest`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-base sm:text-lg font-extrabold text-[var(--text)] truncate"
                  >
                    {metricConfig.format(stats.latest)}
                  </motion.div>
                </AnimatePresence>
                {stats.change !== 0 && (
                  <span
                    className={`text-[10px] font-bold inline-flex items-center gap-0.5 mt-0.5 ${
                      stats.change > 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {stats.change > 0 ? '+' : ''}
                    {stats.change.toFixed(1)}% vs buổi trước
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[11px] font-medium text-[var(--muted)] block mb-1">
                  Trung bình
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${metric}-avg`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-base sm:text-lg font-extrabold text-[var(--text)] truncate"
                  >
                    {metricConfig.format(stats.avg)}
                  </motion.div>
                </AnimatePresence>
                <span className="text-[10px] text-[var(--muted)]">Qua {graphData.length} buổi đấu</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[11px] font-medium text-[var(--muted)] block mb-1">
                  Cao nhất
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${metric}-max`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-base sm:text-lg font-extrabold text-emerald-500 truncate"
                  >
                    {metricConfig.format(stats.max)}
                  </motion.div>
                </AnimatePresence>
                <span className="text-[10px] text-[var(--muted)]">Mức trần chi phí</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[11px] font-medium text-[var(--muted)] block mb-1">
                  Thấp nhất
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${metric}-min`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-base sm:text-lg font-extrabold text-sky-500 truncate"
                  >
                    {metricConfig.format(stats.min)}
                  </motion.div>
                </AnimatePresence>
                <span className="text-[10px] text-[var(--muted)]">Mức sàn tiết kiệm</span>
              </div>
            </div>

            {/* Informative Banner when showing sample data */}
            {!hasRealHistory && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Chưa có đủ lịch sử ({history?.length || 0}/2 buổi). Đang hiển thị dữ liệu mẫu tham khảo của CLB.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSampleData(!useSampleData)}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-semibold text-[11px] shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {useSampleData ? 'Dữ liệu thực' : 'Dữ liệu mẫu'}
                </button>
              </div>
            )}

            {/* Interactive Graph Canvas Container */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg)] border border-[var(--border)] shadow-inner">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: metricConfig.color }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    {metricConfig.title}
                  </span>
                </div>

                {/* Quick Toggle Controls with animated switch toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ToggleSwitch
                    label="Đường cong"
                    checked={curved}
                    onChange={setCurved}
                    activeColor={metricConfig.color}
                    title="Bật/tắt đường cong uốn lượn Bezier"
                  />
                  <ToggleSwitch
                    label="Vùng sáng"
                    checked={gradientFade}
                    onChange={setGradientFade}
                    activeColor={metricConfig.color}
                    title="Bật/tắt đổ màu gradient vùng sáng"
                  />
                  <ToggleSwitch
                    label="% Tăng giảm"
                    checked={calcPercent}
                    onChange={setCalcPercent}
                    activeColor={metricConfig.color}
                    title="Bật/tắt tính % tăng giảm giữa các buổi trên tooltip"
                  />
                </div>
              </div>

              {/* SimpleGraph component with animated switch transition */}
              <div className="w-full min-h-[300px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${metric}-${curved}-${gradientFade}-${calcPercent}`}
                    initial={{ opacity: 0, y: 8, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.995 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <SimpleGraph
                      data={graphData}
                      lineColor={metricConfig.color}
                      dotColor={metricConfig.color}
                      height={300}
                      animationDuration={0.9}
                      curved={curved}
                      gradientFade={gradientFade}
                      calculatePercentageDifference={calcPercent}
                      showDots={true}
                      dotSize={6}
                      dotHoverGlow={true}
                      gridStyle="dashed"
                      gridLines="both"
                      valueFormatter={metricConfig.format}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="text-[11px] text-[var(--muted)] text-center mt-3 select-none flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rê chuột hoặc chạm vào các điểm tròn để xem chi tiết buổi đấu</span>
              </div>
            </div>

            {/* Historical Sessions Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
                  Lịch sử các buổi thi đấu ({activeItems.length})
                </h4>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-2xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
                {activeItems.map((item, idx) => {
                  const totalP = (item.maleCount || 0) + (item.femaleCount || 0);
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-[var(--card)]/60 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center font-bold text-[11px] text-[var(--muted)]">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
                            <span>{item.date}</span>
                            {item.hostName && (
                              <span className="text-[10px] font-normal text-[var(--muted)]">
                                (Host: {item.hostName})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] mt-0.5">
                            {item.courtName || 'Sân cầu lông'} · {totalP} người ({item.maleCount} Nam / {item.femaleCount} Nữ)
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-[var(--text)] text-sm">
                          {(item.totalCost || 0).toLocaleString()}đ
                        </div>
                        <div className="text-[10px] text-[var(--muted)] flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-blue-500 font-medium">
                            ♂ {(item.costPerMale || 0).toLocaleString()}đ
                          </span>
                          <span>•</span>
                          <span className="text-pink-500 font-medium">
                            ♀ {(item.costPerFemale || 0).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default HistoryGraphModal;
