"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import { Member, BankConfig } from "@/types";
import { parseCourtsList } from "./CourtPickerAndMap";

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
  onSaveToHistory: () => void;
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

  const totalPlayers = namCount + nuCount;
  const courtsList = parseCourtsList(courtNumber);
  const courtsCount = Math.max(1, courtsList.length);
  const rawDigits = courtNumber ? courtNumber.replace(/[^0-9]/g, "") : "";
  const storeNum = rawDigits.slice(0, 4) || "01";
  const refNum = "73928" + (date ? date.replace(/\//g, "") : "102026") + "8472";

  // Account display
  const bankAcc = hostMember?.account_no || bankConfig.accountNo || "";
  const bankName = hostMember?.bank_id || bankConfig.bankId || "MB";
  const accName =
    hostMember?.account_name ||
    bankConfig.accountName ||
    (hostMember ? hostMember.name.toUpperCase() : "FC RAT CHUYEN");
  const maskedAcc = bankAcc
    ? `**** **** **** ${bankAcc.slice(-4) || bankAcc}`
    : "**** **** **** 8371";

  const hostDisplayName = hostMember ? hostMember.name : "Host nhóm";

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const dataUrl = await toPng(receiptRef.current, {
          cacheBust: true,
          pixelRatio: 2.5,
          skipFonts: true,
        });
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
          <button
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
          </button>
          <button
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
          </button>
          <button
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
          </button>
        </div>
      </div>

      {/* Receipt Paper Card */}
      <div
        ref={receiptRef}
        className={`receipt-paper ${themeClass} relative w-full max-w-full sm:max-w-[380px] shadow-2xl rounded-sm border font-mono text-[11px] leading-[1.35] tracking-tight selection:bg-neutral-500/20 overflow-hidden mx-auto`}
      >
        {/* Top Serrated Edge (Jagged cut paper effect) */}
        <div className="w-full h-2.5 bg-[var(--receipt-bg)] relative flex overflow-hidden">
          <svg
            className="w-full h-2 text-[var(--bg)] fill-current scale-y-[-1]"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" />
          </svg>
        </div>

        <div className="p-3.5 sm:p-5 pt-2">
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

        {/* Bottom Serrated Edge (Jagged cut paper effect) */}
        <div className="w-full h-2.5 bg-[var(--receipt-bg)] relative flex overflow-hidden">
          <svg
            className="w-full h-2 text-[var(--bg)] fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" />
          </svg>
        </div>
      </div>

      {/* Action Buttons Toolbar Below Receipt */}
      <div className="w-full max-w-full sm:max-w-[380px] mt-3 space-y-2 no-print mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 active:scale-98 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã sao chép!" : "Sao chép Zalo"}</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[var(--accent)]" />
            <span>Chia sẻ</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenVietQR}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Mã VietQR</span>
          </button>

          <button
            type="button"
            onClick={onSaveToHistory}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent2)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[var(--accent2)]" />
            <span>Lưu lại lịch sử</span>
          </button>
        </div>

        {/* Download receipt as image helper button */}
        <button
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
        </button>
      </div>
    </div>
  );
}
