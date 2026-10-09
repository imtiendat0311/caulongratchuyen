"use client";

import React, { useEffect } from "react";
import { X, Download, ExternalLink, Trophy, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonImage } from "./SkeletonImage";

interface TeamPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamPhotoModal({ isOpen, onClose }: TeamPhotoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="relative w-full max-w-lg rounded-[20px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] overflow-hidden text-[var(--text)] flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </motion.button>

        {/* Modal Header */}
        <div className="p-4 pb-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <Trophy className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text)]">
              FC Rất Chuyên
            </h3>
            <p className="text-xs text-[var(--muted)]">
              CLB Cầu Lông Rất Chuyên • Ảnh kỷ niệm nhóm
            </p>
          </div>
        </div>

        {/* Image Container */}
        <div className="px-4 py-1 flex-1 overflow-auto flex items-center justify-center">
          <div className="relative rounded-[14px] overflow-hidden border border-[var(--border)] shadow-md bg-black max-w-full w-full flex items-center justify-center">
            <SkeletonImage
              src="/team-photo.jpg"
              alt="FC Rất Chuyên"
              showIcon={true}
              wrapperClassName="w-full min-h-[260px] sm:min-h-[340px] flex items-center justify-center"
              className="w-full h-auto max-h-[60vh] object-contain rounded-[14px]"
            />
          </div>
        </div>

        {/* Footer info & actions */}
        <div className="p-4 pt-2.5 flex items-center justify-between gap-2 flex-wrap border-t border-[var(--border)] mt-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>CLB Cầu Lông Rất Chuyên</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.a
              whileTap={{ scale: 0.94 }}
              href="/team-photo.jpg"
              download="FC-Rat-Chuyen.jpg"
              className="py-1.5 px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Tải ảnh</span>
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.94 }}
              href="/team-photo.jpg"
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem kích thước gốc</span>
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
