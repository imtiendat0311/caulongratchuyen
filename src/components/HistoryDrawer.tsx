"use client";

import React from "react";
import { History, X, Trash2, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryItem } from "@/types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onRestore: (item: HistoryItem) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onDelete,
  onClear,
  onRestore,
}: HistoryDrawerProps) {
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
                    Lịch Sử Buổi Chơi
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {history.length} buổi chơi đã lưu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
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

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
              <History className="w-10 h-10 mb-2 stroke-1 opacity-50" />
              <p className="text-sm font-medium text-[var(--text)]">
                Chưa có buổi chơi nào được lưu
              </p>
              <p className="text-xs mt-1 text-[var(--muted)]">
                Bấm &quot;Lưu buổi chơi này&quot; để lưu lại kết quả chi phí từng buổi.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--bg)] space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text)]">
                    {item.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRestore(item)}
                      className="flex items-center gap-0.5 text-xs text-[var(--accent)] hover:underline cursor-pointer font-medium"
                      title="Nạp lại buổi này"
                    >
                      <span>Xem lại</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-[var(--muted)] hover:text-red-500 transition-colors cursor-pointer"
                      title="Xóa buổi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 px-1 bg-[var(--card)] rounded-[8px] border border-[var(--border)]">
                  <div>
                    <div className="text-[10px] text-[var(--muted)]">Tổng chi</div>
                    <div className="font-bold text-xs text-[var(--accent2)]">
                      {Math.round(item.totalCost).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted)]">
                      Mỗi Nam ({item.maleCount})
                    </div>
                    <div className="font-bold text-xs text-[var(--accent)]">
                      {Math.round(item.costPerMale).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted)]">
                      Mỗi Nữ ({item.femaleCount})
                    </div>
                    <div className="font-bold text-xs text-[var(--female)]">
                      {Math.round(item.costPerFemale).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-[var(--muted)] line-clamp-2 italic">
                    &quot;{item.notes}&quot;
                  </p>
                )}
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
