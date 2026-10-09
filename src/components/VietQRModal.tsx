"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  X,
  Copy,
  Check,
  ExternalLink,
  Crown,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BankConfig, Member, POPULAR_BANKS } from "@/types";

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankConfig: BankConfig;
  onSaveBankConfig: (cfg: BankConfig) => void;
  amountNam: number;
  amountNu: number;
  hostName?: string;
  activeHostMember?: Member | null;
  onUpdateMemberBank?: (
    memberId: string,
    bankId: string,
    accountNo: string,
    accountName: string
  ) => Promise<void>;
}

export function VietQRModal({
  isOpen,
  onClose,
  bankConfig,
  onSaveBankConfig,
  amountNam,
  amountNu,
  hostName,
  activeHostMember,
  onUpdateMemberBank,
}: VietQRModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <VietQRContent
          key={activeHostMember?.id || "default-bank"}
          onClose={onClose}
          bankConfig={bankConfig}
          onSaveBankConfig={onSaveBankConfig}
          amountNam={amountNam}
          amountNu={amountNu}
          hostName={hostName}
          activeHostMember={activeHostMember}
          onUpdateMemberBank={onUpdateMemberBank}
        />
      )}
    </AnimatePresence>
  );
}

type VietQRContentProps = Omit<VietQRModalProps, "isOpen">;

function VietQRContent({
  onClose,
  bankConfig,
  onSaveBankConfig,
  amountNam,
  amountNu,
  hostName,
  activeHostMember,
  onUpdateMemberBank,
}: VietQRContentProps) {
  const initialBankId = activeHostMember?.bank_id || bankConfig.bankId || "MB";
  const initialAccountNo =
    activeHostMember?.account_no || bankConfig.accountNo || "";
  const initialAccountName =
    activeHostMember?.account_name ||
    bankConfig.accountName ||
    (activeHostMember ? activeHostMember.name.toUpperCase() : "");

  const [bankId, setBankId] = useState(initialBankId);
  const [accountNo, setAccountNo] = useState(initialAccountNo);
  const [accountName, setAccountName] = useState(initialAccountName);
  const [selectedGender, setSelectedGender] = useState<"nam" | "nu">("nam");
  const [copied, setCopied] = useState(false);

  // QR Theme mode
  const [qrTheme, setQrTheme] = useState<"auto" | "light" | "dark">("auto");
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [processedQrs, setProcessedQrs] = useState<{
    light: string;
    dark: string;
  } | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(true);

  useEffect(() => {
    const checkDark = () => {
      const isDocDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      const isMediaDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsSystemDark(isDocDark || isMediaDark);
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => checkDark();
    media.addEventListener("change", handleMedia);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", handleMedia);
    };
  }, []);

  const isDarkQR =
    qrTheme === "dark" || (qrTheme === "auto" && isSystemDark);

  const currentAmount = selectedGender === "nam" ? amountNam : amountNu;
  const description = `Cau long ${selectedGender === "nam" ? "Nam" : "Nu"}`;

  const qrUrl =
    bankId && accountNo.trim()
      ? `https://img.vietqr.io/image/${bankId}-${accountNo.trim()}-compact2.png?amount=${Math.round(
          currentAmount
        )}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(
          accountName.trim()
        )}`
      : null;

  useEffect(() => {
    if (!qrUrl) {
      setProcessedQrs(null);
      setIsQrLoading(false);
      return;
    }
    let isCurrent = true;
    setIsQrLoading(true);

    fetch(qrUrl)
      .then((res) => res.blob())
      .then((blob) => {
        if (!isCurrent) return;
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (width > 0 && height > 0) {
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, width, height);
                const pixels = imgData.data;

                const lightData = ctx.createImageData(width, height);
                const darkData = ctx.createImageData(width, height);

                const lightBgR = 255, lightBgG = 255, lightBgB = 255;
                const lightModR = 17, lightModG = 17, lightModB = 17;

                const darkBgR = 28, darkBgG = 32, darkBgB = 48; // #1c2030 matching modal card
                const darkModR = 255, darkModG = 255, darkModB = 255;

                for (let y = 0; y < height; y++) {
                  for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    const a = pixels[idx + 3];

                    // Check if pixel is part of colored logos (VietQR, Napas, Bank branding)
                    const diff = Math.max(r, g, b) - Math.min(r, g, b);
                    const isColored = a > 50 && diff > 22;

                    if (isColored) {
                      // Alpha de-fringing against original white card background
                      const minVal = Math.min(r, g, b);
                      const alpha = Math.max(0, Math.min(1, 1 - (minVal / 248)));

                      // Light mode: authentic logo colors
                      lightData.data[idx] = r;
                      lightData.data[idx + 1] = g;
                      lightData.data[idx + 2] = b;
                      lightData.data[idx + 3] = a;

                      // Dark mode: blend edge anti-aliasing towards dark card background
                      darkData.data[idx] = Math.max(0, Math.min(255, Math.round(r + (1 - alpha) * (darkBgR - 255))));
                      darkData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g + (1 - alpha) * (darkBgG - 255))));
                      darkData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b + (1 - alpha) * (darkBgB - 255))));
                      darkData.data[idx + 3] = 255;
                    } else {
                      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                      // Filter JPEG ringing while preserving smooth anti-aliased module & font edges
                      let t = (brightness - 55) / (205 - 55);
                      if (t < 0) t = 0;
                      if (t > 1) t = 1;
                      t = t * t * (3 - 2 * t);

                      lightData.data[idx] = Math.round(lightModR * (1 - t) + lightBgR * t);
                      lightData.data[idx + 1] = Math.round(lightModG * (1 - t) + lightBgG * t);
                      lightData.data[idx + 2] = Math.round(lightModB * (1 - t) + lightBgB * t);
                      lightData.data[idx + 3] = 255;

                      darkData.data[idx] = Math.round(darkModR * (1 - t) + darkBgR * t);
                      darkData.data[idx + 1] = Math.round(darkModG * (1 - t) + darkBgG * t);
                      darkData.data[idx + 2] = Math.round(darkModB * (1 - t) + darkBgB * t);
                      darkData.data[idx + 3] = 255;
                    }
                  }
                }

                ctx.putImageData(lightData, 0, 0);
                const lightUrl = canvas.toDataURL("image/png");

                ctx.putImageData(darkData, 0, 0);
                const darkUrl = canvas.toDataURL("image/png");

                if (isCurrent) {
                  setProcessedQrs({ light: lightUrl, dark: darkUrl });
                  setIsQrLoading(false);
                }
              }
            }
          } catch (procErr) {
            console.warn("Lỗi xử lý canvas VietQR:", procErr);
            if (isCurrent) setIsQrLoading(false);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          if (isCurrent) setIsQrLoading(false);
        };
        img.src = blobUrl;
      })
      .catch((err) => {
        console.warn("Lỗi tải VietQR blob:", err);
        if (isCurrent) setIsQrLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [qrUrl]);

  const activeQrSrc = qrUrl
    ? isDarkQR
      ? processedQrs?.dark || qrUrl
      : processedQrs?.light || qrUrl
    : null;

  const handleCopyAcc = () => {
    if (!accountNo) return;
    navigator.clipboard.writeText(`${accountNo} - ${bankId} (${accountName})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLargeImage = () => {
    if (!activeQrSrc && !qrUrl) return;
    const targetSrc = activeQrSrc || qrUrl;
    if (targetSrc?.startsWith("data:")) {
      fetch(targetSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        })
        .catch(() => {
          window.open(qrUrl || targetSrc, "_blank");
        });
    } else if (targetSrc) {
      window.open(targetSrc, "_blank");
    }
  };

  const handleBankChange = (newBankId: string) => {
    setBankId(newBankId);
    const updated = { ...bankConfig, bankId: newBankId };
    onSaveBankConfig(updated);
    if (activeHostMember && onUpdateMemberBank) {
      onUpdateMemberBank(activeHostMember.id, newBankId, accountNo, accountName);
    }
  };

  const handleAccountNoChange = (newAccNo: string) => {
    setAccountNo(newAccNo);
    const updated = { ...bankConfig, accountNo: newAccNo.trim() };
    onSaveBankConfig(updated);
    if (activeHostMember && onUpdateMemberBank) {
      onUpdateMemberBank(activeHostMember.id, bankId, newAccNo, accountName);
    }
  };

  const handleAccountNameChange = (newAccName: string) => {
    const uppercase = newAccName.trim().toUpperCase();
    setAccountName(uppercase);
    const updated = { ...bankConfig, accountName: uppercase };
    onSaveBankConfig(updated);
    if (activeHostMember && onUpdateMemberBank) {
      onUpdateMemberBank(activeHostMember.id, bankId, accountNo, uppercase);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className="relative w-full max-w-sm rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] p-5 text-[var(--text)] overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Close button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text)]">
              Mã VietQR Nhận Tiền
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Quét mã ngân hàng để chuyển tiền cho Host
            </p>
          </div>
        </div>

        {/* Host banner */}
        {hostName && (
          <div className="mb-3 p-2 rounded-[10px] bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs">
            <Crown className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-amber-500">Host nhận tiền:</span>{" "}
              <span className="font-semibold text-[var(--text)]">{hostName}</span>
            </div>
          </div>
        )}

        <div className="overflow-y-auto pr-0.5 space-y-3">
          {/* Bank Config Form */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                  Ngân hàng
                </label>
                <div className="relative">
                  <select
                    value={bankId}
                    onChange={(e) => handleBankChange(e.target.value)}
                    className="w-full appearance-none h-8 pl-2.5 pr-7 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} - {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={accountNo}
                  placeholder="VD: 0988..."
                  onChange={(e) => handleAccountNoChange(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-[10px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                Tên chủ tài khoản (không dấu)
              </label>
              <input
                type="text"
                value={accountName}
                placeholder="VD: NGUYEN VAN A"
                onChange={(e) => handleAccountNameChange(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs rounded-[10px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] uppercase"
              />
            </div>
          </div>

          {/* Gender selector for QR amount */}
          <div className="flex rounded-[10px] bg-[var(--bg)] border border-[var(--border)] p-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setSelectedGender("nam")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                selectedGender === "nam"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Nam: {Math.round(amountNam).toLocaleString("vi-VN")} đ
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setSelectedGender("nu")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                selectedGender === "nu"
                  ? "bg-[var(--female)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Nữ: {Math.round(amountNu).toLocaleString("vi-VN")} đ
            </motion.button>
          </div>

          {/* QR Display */}
          {qrUrl ? (
            <div className="flex flex-col items-center justify-center p-3 bg-[var(--bg)] rounded-[14px] border border-[var(--border)] shadow-xs transition-colors">
              {/* Theme selector bar for QR */}
              <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
                <span className="text-[11px] font-semibold text-[var(--muted)]">
                  Chế độ hiển thị QR
                </span>
                <div className="inline-flex p-0.5 rounded-[8px] bg-[var(--card)] border border-[var(--border)] text-[10px]">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setQrTheme("auto")}
                    className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      qrTheme === "auto"
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                    title="Tự động theo giao diện"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tự động</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setQrTheme("light")}
                    className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      qrTheme === "light"
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                    title="Nền sáng truyền thống"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Sáng</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setQrTheme("dark")}
                    className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      qrTheme === "dark"
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                    title="Nền tối hòa hợp"
                  >
                    <Moon className="w-3 h-3" />
                    <span>Tối</span>
                  </motion.button>
                </div>
              </div>

              {/* QR Image Frame */}
              <div
                className={`relative w-44 sm:w-48 aspect-[27/32] p-2 rounded-[14px] border transition-all flex items-center justify-center overflow-hidden ${
                  isDarkQR
                    ? "bg-[#1c2030] border-[#2b3045] shadow-inner"
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                {/* Skeleton Loading State */}
                <div
                  className={`absolute inset-0 p-3 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
                    isQrLoading ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!isQrLoading}
                >
                  {/* Top Bar: Logos placeholder */}
                  <div className="flex items-center justify-between w-full pt-0.5">
                    <div
                      className={`h-4 w-14 rounded-md ${
                        isDarkQR ? "bg-slate-700/60" : "bg-slate-200"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-12 rounded-md ${
                        isDarkQR ? "bg-slate-700/60" : "bg-slate-200"
                      } animate-pulse`}
                    />
                  </div>

                  {/* Center: QR box placeholder */}
                  <div className="flex flex-col items-center justify-center my-auto">
                    <div
                      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center border overflow-hidden ${
                        isDarkQR
                          ? "bg-slate-800/80 border-slate-700/50"
                          : "bg-slate-100 border-slate-200/80"
                      }`}
                    >
                      <QrCode
                        className={`w-12 h-12 ${
                          isDarkQR ? "text-slate-600/70" : "text-slate-300"
                        } animate-pulse`}
                      />
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    </div>
                    <div
                      className={`h-2.5 w-20 rounded-full mt-2.5 ${
                        isDarkQR ? "bg-slate-700/50" : "bg-slate-200"
                      } animate-pulse`}
                    />
                  </div>

                  {/* Bottom: Account info lines placeholder */}
                  <div className="w-full space-y-1.5 pb-0.5">
                    <div
                      className={`h-2.5 w-4/5 mx-auto rounded-full ${
                        isDarkQR ? "bg-slate-700/60" : "bg-slate-200"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-2 w-3/5 mx-auto rounded-full ${
                        isDarkQR ? "bg-slate-700/40" : "bg-slate-200/70"
                      } animate-pulse`}
                    />
                  </div>
                </div>

                {/* QR Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeQrSrc || qrUrl}
                  alt="Mã VietQR Chuyển khoản"
                  className={`w-full h-full object-contain rounded-lg transition-all duration-300 ${
                    isQrLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                  loading="eager"
                  onLoad={() => {
                    if (processedQrs) {
                      setIsQrLoading(false);
                    }
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleCopyAcc}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text)] hover:text-[var(--accent)] bg-[var(--card)] hover:bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Đã chép STK" : "Sao chép STK"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleOpenLargeImage}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text)] hover:text-[var(--accent)] bg-[var(--card)] hover:bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở ảnh lớn
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[var(--muted)] bg-[var(--bg)] rounded-[10px] border border-dashed border-[var(--border)]">
              Vui lòng nhập Số tài khoản để hiển thị mã QR
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
