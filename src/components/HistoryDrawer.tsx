"use client";

import React from "react";
import { History, X, Trash2, ArrowUpRight } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Lịch Sử Buổi Chơi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {history.length} buổi chơi đã lưu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Xóa tất cả lịch sử"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <History className="w-10 h-10 mb-2 stroke-1 opacity-50" />
              <p className="text-sm font-medium">Chưa có buổi chơi nào được lưu</p>
              <p className="text-xs mt-1">
                Bấm &quot;Lưu buổi chơi này&quot; để lưu lại kết quả chi phí từng buổi.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.date}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRestore(item)}
                      className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      title="Nạp lại buổi này"
                    >
                      <span>Xem lại</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa buổi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 px-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400">Tổng chi</div>
                    <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {Math.round(item.totalCost).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">
                      Mỗi Nam ({item.maleCount})
                    </div>
                    <div className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {Math.round(item.costPerMale).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">
                      Mỗi Nữ ({item.femaleCount})
                    </div>
                    <div className="font-bold text-xs text-pink-600 dark:text-pink-400">
                      {Math.round(item.costPerFemale).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
