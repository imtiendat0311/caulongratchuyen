"use client";

import React, { useState, useMemo } from "react";
import { History, X, Trash2, ArrowUpRight, Search, CloudDownload, Loader2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryItem } from "@/types";
import { searchReceiptsFromCloud } from "@/lib/store";
import { generateUpcBarcodeBars } from "@/lib/bill-utils";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onRestore: (item: HistoryItem) => void;
  onOpenGraph?: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onDelete,
  onClear,
  onRestore,
  onOpenGraph,
}: HistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cloudResults, setCloudResults] = useState<HistoryItem[] | null>(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [cloudSearchError, setCloudSearchError] = useState<string | null>(null);

  // Local filtered items
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      const matchOrder = item.orderNumber?.toLowerCase().includes(q);
      const matchHost = item.hostName?.toLowerCase().includes(q);
      const matchDate = item.date?.toLowerCase().includes(q);
      const matchCourt = item.courtName?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchOrder || matchHost || matchDate || matchCourt || matchNotes;
    });
  }, [history, searchQuery]);

  const handleSearchCloud = async () => {
    const q = searchQuery.trim();
    if (!q || isSearchingCloud) return;
    setIsSearchingCloud(true);
    setCloudSearchError(null);
    try {
      const res = await searchReceiptsFromCloud({ keyword: q });
      if (res.success && res.data) {
        setCloudResults(res.data);
      } else {
        setCloudSearchError(res.message || "Không tìm thấy hóa đơn phù hợp trên Cloud");
      }
    } catch {
      setCloudSearchError("Lỗi kết nối khi tra cứu hóa đơn");
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setCloudResults(null);
    setCloudSearchError(null);
  };

  const itemsToDisplay = cloudResults !== null ? cloudResults : filteredHistory;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="w-full max-w-md h-full bg-[var(--card)] border-l border-[var(--border)] shadow-[var(--shadow)] flex flex-col text-[var(--text)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--accent2)]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text)]">
                    Lịch Sử & Tra Cứu Hóa Đơn
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {history.length} buổi chơi đã lưu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenGraph && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onOpenGraph}
                    className="p-2 rounded-xl text-emerald-500 hover:bg-[var(--bg)] transition-colors cursor-pointer"
                    title="Xem biểu đồ lịch sử chi phí"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </motion.button>
                )}
                {history.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onClear}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-red-500 hover:bg-[var(--bg)] transition-colors cursor-pointer"
                    title="Xóa tất cả lịch sử"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (cloudResults !== null) setCloudResults(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchCloud();
                  }}
                  placeholder="Tra cứu: Tên Host hoặc Mã đơn (#CL-...)..."
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={handleResetSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[var(--muted)] truncate">
                    {cloudResults !== null
                      ? `Kết quả Cloud: ${cloudResults.length} hóa đơn`
                      : `Bộ lọc: ${filteredHistory.length} kết quả`}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSearchCloud}
                    disabled={isSearchingCloud}
                    className="px-2 py-0.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSearchingCloud ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CloudDownload className="w-3 h-3" />
                    )}
                    <span>Tra cứu Cloud</span>
                  </motion.button>
                </div>
              )}

              {cloudSearchError && (
                <div className="text-[11px] text-red-500 bg-red-500/10 p-2 rounded-lg">
                  {cloudSearchError}
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {itemsToDisplay.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
                  <History className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                  <p className="text-sm font-medium text-[var(--text)]">
                    {searchQuery
                      ? "Không tìm thấy hóa đơn nào phù hợp"
                      : "Chưa có buổi chơi nào được lưu"}
                  </p>
                  <p className="text-xs mt-1 text-[var(--muted)] max-w-xs">
                    {searchQuery
                      ? "Thử nhập tên Host, mã đơn hoặc bấm 'Tra cứu Cloud' để tìm lại các hóa đơn đã lưu trên hệ thống."
                      : "Bấm 'Lưu buổi chơi này' trên giao diện để lưu lại kết quả chi phí từng buổi."}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={handleSearchCloud}
                      disabled={isSearchingCloud}
                      className="mt-3 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--bg)] flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSearchingCloud ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CloudDownload className="w-3.5 h-3.5" />
                      )}
                      <span>Tìm trên Cloud cho &quot;{searchQuery}&quot;</span>
                    </button>
                  )}
                </div>
              ) : (
                itemsToDisplay.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden font-mono transition-all hover:shadow-md hover:border-[var(--accent)]/40 group select-none"
                  >
                    {/* Compact Receipt Header Strip */}
                    <div className="px-3.5 pt-3 pb-2.5 bg-[var(--bg)]/70 border-b border-dashed border-[var(--border)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text)]">
                              🧾 CẦU LÔNG RẤT CHUYÊN
                            </span>
                          </div>
                          <div className="text-[9.5px] uppercase tracking-widest text-[var(--muted)] mt-0.5 font-bold">
                            HÓA ĐƠN #{item.orderNumber || item.id.slice(-8)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onRestore(item)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-2xs"
                            title="Nạp lại hóa đơn này vào màn hình tính tiền"
                          >
                            <span>Xem lại</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 text-[var(--muted)] hover:text-rose-500 transition-colors cursor-pointer rounded-lg hover:bg-[var(--card)]"
                            title="Xóa hóa đơn này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata: Date, Host, Court */}
                      <div className="mt-2 pt-1.5 border-t border-dashed border-[var(--border)]/60 text-[10px] space-y-0.5 text-[var(--muted)]">
                        <div className="flex items-center justify-between">
                          <span>NGÀY:</span>
                          <span className="font-semibold text-[var(--text)]">{item.date}</span>
                        </div>
                        {item.hostName && (
                          <div className="flex items-center justify-between">
                            <span>HOST:</span>
                            <span className="font-semibold text-[var(--text)]">👑 {item.hostName}</span>
                          </div>
                        )}
                        {item.courtName && (
                          <div className="flex items-center justify-between">
                            <span>SÂN:</span>
                            <span className="font-medium text-[var(--text)] truncate max-w-[190px]">
                              {item.courtName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ticket Punch Notches & Breakdown */}
                    <div className="relative py-2.5 px-3.5 space-y-1.5 text-xs bg-[var(--card)]">
                      {/* Left Ticket Notch */}
                      <div className="absolute -left-2.5 top-0 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg)] border border-[var(--border)]" />
                      {/* Right Ticket Notch */}
                      <div className="absolute -right-2.5 top-0 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg)] border border-[var(--border)]" />

                      {/* Receipt Items Breakdown with dot leaders */}
                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className="text-[11px] text-[var(--muted)] font-bold tracking-tight">
                          TỔNG CHI PHÍ
                        </span>
                        <span className="border-b border-dotted border-[var(--border)] flex-1 min-w-[12px] opacity-70" />
                        <span className="text-xs font-black text-emerald-500 shrink-0">
                          {Math.round(item.totalCost).toLocaleString("vi-VN")} đ
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className="text-[11px] text-[var(--muted)]">
                          MỖI NAM ({item.maleCount})
                        </span>
                        <span className="border-b border-dotted border-[var(--border)] flex-1 min-w-[12px] opacity-70" />
                        <span className="text-xs font-bold text-sky-500 shrink-0">
                          {Math.round(item.costPerMale).toLocaleString("vi-VN")} đ
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className="text-[11px] text-[var(--muted)]">
                          MỖI NỮ ({item.femaleCount})
                        </span>
                        <span className="border-b border-dotted border-[var(--border)] flex-1 min-w-[12px] opacity-70" />
                        <span className="text-xs font-bold text-pink-500 shrink-0">
                          {Math.round(item.costPerFemale).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>

                    {/* Note Section (if present) */}
                    {item.notes && (
                      <div className="px-3.5 pb-2 text-[10px] text-[var(--muted)] border-t border-dashed border-[var(--border)]/70 pt-1.5 italic line-clamp-2 bg-[var(--card)]">
                        &quot;{item.notes}&quot;
                      </div>
                    )}

                    {/* Barcode Strip Footer */}
                    <div className="px-3.5 py-1.5 bg-[var(--bg)]/60 border-t border-dashed border-[var(--border)] flex items-center justify-between gap-2">
                      {/* Real UPC Barcode SVG */}
                      <svg viewBox="0 0 200 35" className="h-3.5 w-24 text-[var(--text)] opacity-70 shrink-0">
                        {generateUpcBarcodeBars(item.serialNumber || item.orderNumber || item.id).map((bar, idx) => (
                          <rect
                            key={idx}
                            x={bar.x}
                            y={0}
                            width={bar.width}
                            height={35}
                            fill="currentColor"
                          />
                        ))}
                      </svg>

                      <span className="text-[9px] text-[var(--muted)] font-mono tracking-widest uppercase">
                        {item.orderNumber ? item.orderNumber.slice(-8) : item.id.slice(-8)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
