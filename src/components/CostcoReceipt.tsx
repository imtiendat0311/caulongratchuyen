"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  BookmarkPlus,
  Printer,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toBlob, toPng } from "html-to-image";
import { Member, BankConfig } from "@/types";
import { parseCourtsList } from "./CourtPickerAndMap";
import { SkeletonImage } from "./SkeletonImage";

interface CostcoReceiptProps {
  date: string; // DD/MM/YYYY
  courtName: string;
  courtAddress: string;
  courtNumber: string;
  hostMember?: Member | null;
  bankConfig: BankConfig;
  namCount: number;
  nuCount: number;
  courtCost: number;
  shuttleCost: number;
  soQua: number;
  waterCost: number;
  totalCost: number;
  finalNam: number;
  finalNu: number;
  ratio: number;
  onCopy: () => void;
  copied: boolean;
  onShare: () => void;
  onOpenVietQR: () => void;
  onSaveToHistory: () => void | Promise<void>;
}

export function CostcoReceipt({
  date,
  courtName,
  courtAddress,
  courtNumber,
  hostMember,
  bankConfig,
  namCount,
  nuCount,
  courtCost,
  shuttleCost,
  soQua,
  waterCost,
  totalCost,
  finalNam,
  finalNu,
  ratio,
  onCopy,
  copied,
  onShare,
  onOpenVietQR,
  onSaveToHistory,
}: CostcoReceiptProps) {
  const [receiptTheme, setReceiptTheme] = useState<"auto" | "light" | "dark">("auto");
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);

  const handleSaveToHistoryClick = async () => {
    if (isSavingHistory) return;
    setIsSavingHistory(true);
    try {
      await Promise.resolve(onSaveToHistory());
      setHistorySaved(true);
      setTimeout(() => setHistorySaved(false), 2200);
    } finally {
      setIsSavingHistory(false);
    }
  };

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

  const isDarkReceipt =
    receiptTheme === "dark" || (receiptTheme === "auto" && isSystemDark);

  const totalPlayers = namCount + nuCount;
  const courtsList = parseCourtsList(courtNumber);
  const courtsCount = Math.max(1, courtsList.length);
  const rawDigits = courtNumber ? courtNumber.replace(/[^0-9]/g, "") : "";
  const storeNum = rawDigits.slice(0, 4) || "01";
  const refNum = "73928" + (date ? date.replace(/\//g, "") : "102026") + "8472";

  // Account display
  const bankAcc = hostMember?.account_no || bankConfig.accountNo || "";
  const bankId = hostMember?.bank_id || bankConfig.bankId || "MB";
  const bankName = bankId;
  const accName =
    hostMember?.account_name ||
    bankConfig.accountName ||
    (hostMember ? hostMember.name.toUpperCase() : "FC RAT CHUYEN");
  const maskedAcc = bankAcc
    ? `**** **** **** ${bankAcc.slice(-4) || bankAcc}`
    : "**** **** **** 8371";

  const hostDisplayName = hostMember ? hostMember.name : "Host nhóm";

  const qrUrl =
    bankId && bankAcc.trim()
      ? `https://img.vietqr.io/image/${bankId}-${bankAcc.trim()}-qr_only.png?addInfo=${encodeURIComponent(
          "Cau long FC Rat Chuyen"
        )}&accountName=${encodeURIComponent(accName.trim())}`
      : null;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [processedQrs, setProcessedQrs] = useState<{
    light: string;
    dark: string;
  } | null>(null);

  useEffect(() => {
    if (!qrUrl) return;
    let isCurrent = true;

    fetch(qrUrl)
      .then((res) => res.blob())
      .then((blob) => {
        if (!isCurrent) return;
        const blobUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isCurrent && typeof reader.result === "string") {
            setQrDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);

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

                const lightBgR = 252, lightBgG = 252, lightBgB = 251;
                const lightModR = 17, lightModG = 17, lightModB = 17;

                const darkBgR = 20, darkBgG = 23, darkBgB = 31;
                const darkModR = 255, darkModG = 255, darkModB = 255;

                for (let y = 0; y < height; y++) {
                  for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    const a = pixels[idx + 3];

                    // Check if pixel is part of the colored VietQR logo (red V)
                    const diff = Math.max(r, g, b) - Math.min(r, g, b);
                    const isColored = a > 50 && diff > 22 && r > g && r > b;

                    if (isColored) {
                      // Alpha de-fringing: un-premultiply white background to eliminate white halo
                      const minVal = Math.min(g, b);
                      const alpha = Math.max(0, Math.min(1, 1 - (minVal / 248)));

                      // Light mode: seamless blend with receipt paper
                      lightData.data[idx] = Math.max(0, Math.min(255, Math.round(r + (1 - alpha) * (lightBgR - 255))));
                      lightData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g + (1 - alpha) * (lightBgG - 255))));
                      lightData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b + (1 - alpha) * (lightBgB - 255))));
                      lightData.data[idx + 3] = 255;

                      // Dark mode: seamless blend with dark receipt background (no white/pink halo)
                      darkData.data[idx] = Math.max(0, Math.min(255, Math.round(r + (1 - alpha) * (darkBgR - 255))));
                      darkData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g + (1 - alpha) * (darkBgG - 255))));
                      darkData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b + (1 - alpha) * (darkBgB - 255))));
                      darkData.data[idx + 3] = 255;
                    } else {
                      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                      // Filter out JPEG compression noise while preserving smooth anti-aliased module edges
                      let t = (brightness - 55) / (205 - 55);
                      if (t < 0) t = 0;
                      if (t > 1) t = 1;
                      // Smoothstep curve for clean contrast without blocky staircasing
                      t = t * t * (3 - 2 * t);

                      // Light mode: t=1 is background, t=0 is module
                      lightData.data[idx] = Math.round(lightModR * (1 - t) + lightBgR * t);
                      lightData.data[idx + 1] = Math.round(lightModG * (1 - t) + lightBgG * t);
                      lightData.data[idx + 2] = Math.round(lightModB * (1 - t) + lightBgB * t);
                      lightData.data[idx + 3] = 255;

                      // Dark mode: t=1 (was white) is dark bg, t=0 (was black) is white module
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
                }
              }
            }
          } catch (procErr) {
            console.warn("Lỗi xử lý canvas QR:", procErr);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
        };
        img.src = blobUrl;
      })
      .catch((err) => {
        console.warn("Lỗi tải VietQR data URL:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [qrUrl]);

  const displayQrSrc = qrUrl
    ? isDarkReceipt
      ? processedQrs?.dark || null
      : processedQrs?.light || null
    : null;

  const fallbackQrSrc = qrDataUrl || qrUrl;
  const activeQrDataUrl = displayQrSrc || fallbackQrSrc;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    file: File;
    platform: "ios" | "android" | "desktop";
  } | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleSharePreview = async () => {
    if (!previewData) return;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [previewData.file] })
    ) {
      try {
        await navigator.share({
          files: [previewData.file],
          title: "Biên lai Cầu Lông Rất Chuyên",
          text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
        });
      } catch {
        // user cancelled
      }
    }
  };

  const handleDownloadReceiptImage = async () => {
    if (!receiptRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const fileName = `bien-lai-cau-long-${date ? date.replace(/\//g, "-") : "session"}.png`;

      let blob: Blob | null = null;
      try {
        blob = await toBlob(receiptRef.current, {
          cacheBust: true,
          pixelRatio: 2.5,
        });
      } catch {
        blob = await toBlob(receiptRef.current, {
          cacheBust: true,
          pixelRatio: 2.5,
          skipFonts: true,
        });
      }

      if (!blob) {
        const dataUrl = await toPng(receiptRef.current, {
          cacheBust: true,
          pixelRatio: 2.5,
          skipFonts: true,
        });
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

      if (!blob) return;

      const file = new File([blob], fileName, { type: "image/png" });
      const objectUrl = URL.createObjectURL(blob);

      const isIOS =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

      const isAndroid =
        typeof navigator !== "undefined" &&
        /Android/i.test(navigator.userAgent);

      const isInAppBrowser =
        typeof navigator !== "undefined" &&
        /FBAN|FBAV|Instagram|Messenger|Zalo|Line|Twitter|MicroMessenger/i.test(
          navigator.userAgent
        );

      const platform: "ios" | "android" | "desktop" = isIOS
        ? "ios"
        : isAndroid
        ? "android"
        : "desktop";

      // 1. iOS in native Safari / Chrome: Web Share API opens native iOS Share Sheet with "Lưu hình ảnh" (Save Image to Apple Photos)
      if (isIOS && !isInAppBrowser) {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Biên lai Cầu Lông Rất Chuyên",
              text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
            });
            return;
          } catch (shareErr: unknown) {
            if (shareErr instanceof Error && shareErr.name === "AbortError") {
              return; // User cancelled native share sheet
            }
          }
        }
        // Fallback for iOS if share sheet fails: in-app preview modal
        setPreviewData({ url: objectUrl, file, platform: "ios" });
        return;
      }

      // 2. In-App Browsers on iOS or Android (Messenger, Zalo, Facebook, etc.):
      // In-app webviews block direct file downloads and blob navigations.
      // Show in-app preview modal so user can long-press to save image directly to Gallery / Photos.
      if (isInAppBrowser) {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Biên lai Cầu Lông Rất Chuyên",
              text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
            });
            return;
          } catch (shareErr: unknown) {
            if (shareErr instanceof Error && shareErr.name === "AbortError") {
              return;
            }
          }
        }
        setPreviewData({ url: objectUrl, file, platform });
        return;
      }

      // 3. Android (Chrome, Samsung Internet, Edge, etc.) & Desktop:
      // Trigger native download. On Android, this saves to /Download and automatically registers in Samsung Gallery / Google Photos!
      const link = document.createElement("a");
      link.download = fileName;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      // On Android, show confirmation toast
      if (isAndroid) {
        setDownloadToast("✓ Đã lưu biên lai vào Thư viện ảnh / Tải về!");
        setTimeout(() => setDownloadToast(null), 3500);
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh biên lai:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const themeClass =
    receiptTheme === "light"
      ? "force-light"
      : receiptTheme === "dark"
      ? "force-dark"
      : "";

  return (
    <div className="w-full flex flex-col items-center">
      {/* Receipt Theme Mode Selector (Discreet control bar) */}
      <div className="w-full max-w-full sm:max-w-[380px] mb-2 flex items-center justify-between text-xs px-1 gap-1 flex-wrap no-print">
        <span className="text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1 shrink-0">
          <span>Biên lai chi phí</span>
        </span>
        <div className="inline-flex p-0.5 rounded-[8px] bg-[var(--card)] border border-[var(--border)] text-[10px] shrink-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("auto")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "auto"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Tự động theo giao diện hệ thống"
          >
            <Sparkles className="w-3 h-3" />
            <span>Tự động</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("light")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "light"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Giấy trắng cổ điển"
          >
            <Sun className="w-3 h-3" />
            <span>Giấy sáng</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("dark")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "dark"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Giấy tối hiện đại"
          >
            <Moon className="w-3 h-3" />
            <span>Giấy tối</span>
          </motion.button>
        </div>
      </div>

      {/* Receipt Paper Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        ref={receiptRef}
        className={`receipt-paper ${themeClass} relative w-full max-w-full sm:max-w-[380px] shadow-2xl rounded-[16px] border font-mono text-[11px] leading-[1.35] tracking-tight selection:bg-neutral-500/20 overflow-hidden mx-auto`}
      >
        <div className="p-4 sm:p-5">
          {/* Logo Header */}
          <div className="text-center mb-3">
            <div className="inline-flex flex-col items-center">
              {/* Brand Title */}
              <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-[var(--receipt-text)] uppercase transform -skew-x-6">
                CẦU LÔNG
              </div>
              <div className="flex items-center gap-1.5 w-full justify-center -mt-0.5">
                <div className="h-[2px] bg-[var(--receipt-brand-line)] flex-1 min-w-[20px]" />
                <span className="text-[10px] font-black tracking-widest uppercase text-[var(--receipt-text)]">
                  RẤT CHUYÊN
                </span>
                <div className="h-[2px] bg-[var(--receipt-brand-line)] flex-1 min-w-[20px]" />
              </div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--receipt-muted)] mt-0.5">
                ≡ BADMINTON CLUB ≡
              </div>
            </div>

            {/* Store & Court Address */}
            <div className="mt-2 text-center text-[10.5px] leading-tight space-y-0.5">
              <div className="font-bold text-[var(--receipt-text)]">
                Store #{storeNum.padStart(4, "0")} • {courtsCount > 1 ? `${courtsCount} SÂN (${courtNumber})` : (courtNumber || "Sân 1, Sân 2")}
              </div>
              <div className="font-semibold text-[var(--receipt-text)] uppercase">
                {courtName || "Nhà Thi Đấu Quán Thánh"}
              </div>
              <div className="text-[var(--receipt-muted)] text-[10px]">
                {courtAddress || "115 Quán Thánh, Ba Đình, Hà Nội"}
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Member & Session Info */}
          <div className="text-[10.5px] space-y-0.5 mb-2 text-[var(--receipt-text)]">
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Thành viên:</span>
              <span className="font-bold truncate text-right">
                {totalPlayers} bạn ({namCount} Nam / {nuCount} Nữ)
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Host:</span>
              <span className="font-bold truncate text-right">
                {hostDisplayName}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Ngày chơi:</span>
              <span className="font-semibold text-right">{date || "Hôm nay"}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-1 my-2">
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">
                TIỀN SÂN ({courtsCount > 1 ? `${courtsCount} sân • ${courtNumber}` : (courtNumber || "2 giờ")})
              </span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                {courtCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">
                TIỀN CẦU ({soQua} quả)
              </span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                {shuttleCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">TIỀN NƯỚC UỐNG</span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                {waterCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Subtotal & Total */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-[var(--receipt-muted)]">
              <span>TỔNG CHI PHÍ</span>
              <span className="text-[var(--receipt-text)]">{totalCost.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="flex justify-between text-[var(--receipt-subtle)]">
              <span>THUẾ (0%)</span>
              <span>0 đ</span>
            </div>
            <div className="border-b border-[var(--receipt-dashed)] my-1" />
            <div className="flex justify-between text-sm sm:text-base font-black text-[var(--receipt-text)]">
              <span>TỔNG CỘNG</span>
              <span>{totalCost.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Split Amount Breakdown Section */}
          <div className="border-y border-dashed border-[var(--receipt-dashed)] py-2.5 my-2 space-y-1.5">
            <div className="font-bold text-[10px] uppercase text-[var(--receipt-muted)] tracking-wider">
              KẾT QUẢ CHIA TIỀN BUỔI CHƠI
            </div>
            <div className="flex justify-between items-center text-xs gap-1">
              <span className="font-semibold text-[var(--receipt-text)] truncate">
                MỖI NAM ({namCount} bạn):
              </span>
              <span className="font-bold text-[var(--receipt-text)] text-sm shrink-0">
                {finalNam.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-center text-xs gap-1">
              <span className="font-semibold text-[var(--receipt-text)] truncate">
                MỖI NỮ ({nuCount} bạn{ratio !== 1 ? `, ${Math.round(ratio * 100)}%` : ""}):
              </span>
              <span className="font-bold text-[var(--receipt-text)] text-sm shrink-0">
                {finalNu.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Card / Bank Transfer Info */}
          <div className="text-[10px] leading-tight space-y-1 text-[var(--receipt-muted)] my-2">
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Số tài khoản</span>
              <span className="font-semibold text-[var(--receipt-text)] truncate text-right">{maskedAcc}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Ngân hàng</span>
              <span className="text-[var(--receipt-text)] truncate text-right">
                {bankName} ({accName})
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Hình thức</span>
              <span className="text-[var(--receipt-text)] truncate text-right">CHUYỂN KHOẢN VIETQR</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Thời gian</span>
              <span className="text-[var(--receipt-text)] truncate text-right">{date} 20:30:15 PM</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Mã giao dịch</span>
              <span className="font-mono text-[var(--receipt-text)] truncate text-right">{refNum}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1 font-bold text-[var(--receipt-text)]">
              <span className="shrink-0">Trạng thái</span>
              <span className="truncate text-right">ĐÃ CHIA XONG</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Hoàn tất</span>
              <span className="text-[var(--receipt-text)] truncate text-right">{date} 22:15:00 PM</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />

          {/* Barcode Section */}
          <div className="flex flex-col items-center justify-center my-3 text-[var(--receipt-text)]">
            {/* SVG Barcode */}
            <svg
              className="w-44 sm:w-56 h-10 sm:h-11 max-w-full"
              viewBox="0 0 200 45"
              fill="currentColor"
            >
              {/* Barcode lines simulation */}
              <rect x="0" y="0" width="3" height="45" />
              <rect x="5" y="0" width="1" height="45" />
              <rect x="8" y="0" width="4" height="45" />
              <rect x="15" y="0" width="2" height="45" />
              <rect x="19" y="0" width="1" height="45" />
              <rect x="22" y="0" width="5" height="45" />
              <rect x="29" y="0" width="2" height="45" />
              <rect x="33" y="0" width="1" height="45" />
              <rect x="36" y="0" width="3" height="45" />
              <rect x="42" y="0" width="2" height="45" />
              <rect x="46" y="0" width="4" height="45" />
              <rect x="53" y="0" width="1" height="45" />
              <rect x="56" y="0" width="3" height="45" />
              <rect x="62" y="0" width="2" height="45" />
              <rect x="66" y="0" width="5" height="45" />
              <rect x="73" y="0" width="1" height="45" />
              <rect x="76" y="0" width="4" height="45" />
              <rect x="83" y="0" width="2" height="45" />
              <rect x="87" y="0" width="3" height="45" />
              <rect x="93" y="0" width="1" height="45" />
              <rect x="96" y="0" width="4" height="45" />
              <rect x="103" y="0" width="2" height="45" />
              <rect x="107" y="0" width="5" height="45" />
              <rect x="115" y="0" width="1" height="45" />
              <rect x="118" y="0" width="3" height="45" />
              <rect x="123" y="0" width="4" height="45" />
              <rect x="130" y="0" width="2" height="45" />
              <rect x="134" y="0" width="1" height="45" />
              <rect x="137" y="0" width="5" height="45" />
              <rect x="145" y="0" width="2" height="45" />
              <rect x="149" y="0" width="3" height="45" />
              <rect x="155" y="0" width="1" height="45" />
              <rect x="158" y="0" width="4" height="45" />
              <rect x="165" y="0" width="2" height="45" />
              <rect x="169" y="0" width="3" height="45" />
              <rect x="175" y="0" width="4" height="45" />
              <rect x="182" y="0" width="1" height="45" />
              <rect x="185" y="0" width="3" height="45" />
              <rect x="190" y="0" width="2" height="45" />
              <rect x="194" y="0" width="4" height="45" />
            </svg>
            <div className="font-mono text-[10px] tracking-[0.25em] text-[var(--receipt-muted)] mt-1">
              7 39281 04729 3
            </div>
          </div>

          {/* Dashed Separator */}
          {qrUrl && <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />}

          {/* VietQR Code Section (Before Footer of Receipt) */}
          {qrUrl && (
            <div className="flex flex-col items-center justify-center my-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--receipt-text)] mb-1">
                QUÉT MÃ VIETQR THANH TOÁN
              </div>
              <div className="text-[9.5px] text-[var(--receipt-muted)] mb-2">
                Chuyển khoản trực tiếp cho {hostDisplayName}
              </div>

              {/* QR Container - Blends seamlessly into receipt paper, transparent background, white QR in dark mode */}
              <div className="relative p-2 inline-block bg-transparent w-32 h-32 sm:w-36 sm:h-36">
                {!processedQrs && (
                  <div className="absolute inset-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--receipt-dashed)] bg-[var(--receipt-card)] animate-pulse transition-opacity duration-300">
                    <QrCode className="w-8 h-8 text-[var(--receipt-muted)] opacity-50 mb-1" />
                    <span className="text-[8.5px] font-mono text-[var(--receipt-subtle)]">
                      Đang nạp mã QR...
                    </span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  crossOrigin="anonymous"
                  src={activeQrDataUrl || qrUrl}
                  alt="Mã VietQR thanh toán tiền sân"
                  className={`w-28 h-28 sm:w-32 sm:h-32 object-contain block mx-auto transition-all duration-300 ${
                    !processedQrs ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                />
              </div>

              <div className="text-[9.5px] text-[var(--receipt-muted)] mt-2 font-mono">
                {bankId} • {bankAcc} ({accName})
              </div>
            </div>
          )}

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />

          {/* Footer Receipt Info */}
          <div className="text-center text-[10px] space-y-0.5 text-[var(--receipt-muted)] mt-2">
            <div>Thu ngân / Host: {hostDisplayName}</div>
            <div className="font-bold text-[var(--receipt-text)]">Cảm ơn mọi người!</div>
            <div>Hẹn gặp lại buổi sau!</div>
            <div className="mt-2 text-[var(--receipt-subtle)]">
              Số người chơi: {totalPlayers} bạn
            </div>
            <div className="text-[var(--receipt-subtle)]">
              {date} • caulongratchuyen.vercel.app
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons Toolbar Below Receipt */}
      <div className="w-full max-w-full sm:max-w-[380px] mt-3 space-y-2 no-print mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã sao chép!" : "Sao chép Zalo"}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[var(--accent)]" />
            <span>Chia sẻ</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onOpenVietQR}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Mã VietQR</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            disabled={isSavingHistory}
            onClick={handleSaveToHistoryClick}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60 ${
              historySaved
                ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-[var(--border)] hover:border-[var(--accent2)] text-[var(--text)]"
            }`}
          >
            {historySaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đã lưu lịch sử!</span>
              </>
            ) : isSavingHistory ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent2)]" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-[var(--accent2)]" />
                <span>Lưu lại lịch sử</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Download receipt as image helper button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleDownloadReceiptImage}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
          ) : (
            <Printer className="w-3.5 h-3.5" />
          )}
          <span>In / Lưu biên lai</span>
        </motion.button>
      </div>

      {/* Mobile Save-to-Photos Preview Modal (iOS & Android) */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPreviewData(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-xl p-4 flex flex-col items-center max-h-[92vh] max-h-[92dvh] overflow-y-auto"
            >
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={() => setPreviewData(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </motion.button>

              <h3 className="font-bold text-sm text-[var(--text)] mb-1">
                Lưu Biên Lai Vào Máy
              </h3>
              <p className="text-xs text-[var(--muted)] text-center mb-3 leading-relaxed">
                {previewData.platform === "ios" ? (
                  <span>
                    📱 <strong>Nhấn giữ vào ảnh 1-2 giây</strong> ➜ Chọn <strong>&quot;Lưu hình ảnh&quot;</strong> (Save Image) để lưu vào ứng dụng <strong>Ảnh</strong> của iPhone.
                  </span>
                ) : previewData.platform === "android" ? (
                  <span>
                    📱 <strong>Nhấn giữ vào ảnh 1-2 giây</strong> ➜ Chọn <strong>&quot;Tải hình ảnh xuống&quot;</strong> để lưu vào <strong>Bộ sưu tập (Gallery)</strong> của Android.
                  </span>
                ) : (
                  <span>
                    Nhấn giữ vào ảnh hoặc bấm <strong>Tải về máy</strong> để lưu biên lai.
                  </span>
                )}
              </p>

              <div className="w-full flex justify-center rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)] p-2 shadow-xs mb-3">
                <SkeletonImage
                  src={previewData.url}
                  alt="Biên lai chi phí"
                  showIcon={true}
                  wrapperClassName="max-h-[55vh] max-h-[55dvh] w-full min-h-[220px] flex items-center justify-center"
                  className="max-h-[55vh] max-h-[55dvh] w-auto object-contain rounded-sm select-auto pointer-events-auto mx-auto"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <motion.a
                  whileTap={{ scale: 0.95 }}
                  href={previewData.url}
                  download={`bien-lai-${date ? date.replace(/\//g, "-") : "session"}.png`}
                  className="flex-1 py-2 px-3 rounded-[8px] bg-[var(--accent)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về máy</span>
                </motion.a>

                {typeof navigator !== "undefined" && typeof navigator.canShare === "function" && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSharePreview}
                    className="flex-1 py-2 px-3 rounded-[8px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Chia sẻ</span>
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="py-2 px-4 rounded-[8px] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Đóng
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification (e.g. Android direct download confirmation) */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
