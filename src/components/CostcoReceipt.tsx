"use client";

import React from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  BookmarkPlus,
  Printer,
} from "lucide-react";
import { Member, BankConfig } from "@/types";

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

  const totalPlayers = namCount + nuCount;
  const storeNum = courtNumber ? courtNumber.replace(/[^0-9]/g, "") || "01" : "01";
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

  const hostDisplayName = hostMember ? hostMember.name : "Chủ xị nhóm";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Receipt Paper Card */}
      <div className="relative w-full max-w-[380px] bg-[#fbfbfa] text-[#1a1a1a] shadow-2xl rounded-sm border border-neutral-300 font-mono text-[11px] leading-[1.35] tracking-tight selection:bg-neutral-200 overflow-hidden">
        {/* Top Serrated Edge (Jagged cut paper effect) */}
        <div className="w-full h-2.5 bg-[#fbfbfa] relative flex overflow-hidden">
          <svg
            className="w-full h-2 text-[var(--card)] fill-current scale-y-[-1]"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" />
          </svg>
        </div>

        <div className="p-4 sm:p-5 pt-2">
          {/* Costco Logo Header */}
          <div className="text-center mb-3">
            <div className="inline-flex flex-col items-center">
              {/* Costco Style Brand Title */}
              <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-[#111] uppercase transform -skew-x-6">
                CẦU LÔNG
              </div>
              <div className="flex items-center gap-1.5 w-full justify-center -mt-0.5">
                <div className="h-[2px] bg-[#111] flex-1 min-w-[20px]" />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  RẤT CHUYÊN
                </span>
                <div className="h-[2px] bg-[#111] flex-1 min-w-[20px]" />
              </div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-neutral-600 mt-0.5">
                ≡ WHOLESALE CLUB ≡
              </div>
            </div>

            {/* Store & Court Address */}
            <div className="mt-2 text-center text-[10.5px] leading-tight space-y-0.5">
              <div className="font-bold">
                Store #{storeNum.padStart(4, "0")} • {courtNumber || "Sân 1"}
              </div>
              <div className="font-semibold text-neutral-800 uppercase">
                {courtName || "Nhà Thi Đấu Quán Thánh"}
              </div>
              <div className="text-neutral-600 text-[10px]">
                {courtAddress || "115 Quán Thánh, Ba Đình, Hà Nội"}
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-neutral-400 my-2.5" />

          {/* Member & Session Info */}
          <div className="text-[10.5px] space-y-0.5 mb-2">
            <div className="flex justify-between">
              <span>V5 Member:</span>
              <span className="font-bold">
                {totalPlayers} BẠN ({namCount}M / {nuCount}F)
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Host (Chủ xị):</span>
              <span className="font-bold text-neutral-900">
                👑 {hostDisplayName}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Ngày chơi:</span>
              <span className="font-semibold">{date || "Hôm nay"}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-1 my-2">
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2">E TIEN SAN {courtNumber || "2H"}</span>
              <span className="font-semibold shrink-0">
                {courtCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2">
                E CAU LONG ({soQua} QUA)
              </span>
              <span className="font-semibold shrink-0">
                {shuttleCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2">E TIEN NUOC UONG</span>
              <span className="font-semibold shrink-0">
                {waterCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-neutral-400 my-2.5" />

          {/* Subtotal & Total */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-neutral-700">
              <span>SUBTOTAL</span>
              <span>{totalCost.toLocaleString("vi-VN")} đ</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>TAX (0%)</span>
              <span>0 đ</span>
            </div>
            <div className="border-b border-neutral-300 my-1" />
            <div className="flex justify-between text-sm sm:text-base font-black text-black">
              <span>TOTAL</span>
              <span>{totalCost.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-neutral-400 my-2.5" />

          {/* Split Amount Breakdown Section */}
          <div className="bg-neutral-100 p-2.5 rounded border border-neutral-200 my-2 space-y-1">
            <div className="font-bold text-[10px] uppercase text-neutral-600 tracking-wider">
              KẾT QUẢ CHIA TIỀN BUỔI CHƠI
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-700">
                👉 MỖI NAM ({namCount} bạn):
              </span>
              <span className="font-bold text-blue-800 text-sm">
                {finalNam.toLocaleString("vi-VN")} đ
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-pink-700">
                👉 MỖI NỮ ({nuCount} bạn{ratio !== 1 ? `, ${Math.round(ratio * 100)}%` : ""}):
              </span>
              <span className="font-bold text-pink-800 text-sm">
                {finalNu.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Card / Bank Transfer Info */}
          <div className="text-[10px] leading-tight space-y-1 text-neutral-700 my-2">
            <div className="flex justify-between">
              <span>Card number</span>
              <span className="font-semibold">{maskedAcc}</span>
            </div>
            <div className="flex justify-between">
              <span>Card type</span>
              <span>
                {bankName} ({accName})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Card entry</span>
              <span>CHUYEN KHOAN VIETQR</span>
            </div>
            <div className="flex justify-between">
              <span>Date/time</span>
              <span>{date} 20:30:15 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Reference #</span>
              <span className="font-mono">{refNum}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800">
              <span>Status</span>
              <span>APPROVED / ĐÃ CHIA XONG</span>
            </div>
            <div className="flex justify-between">
              <span>Finalized</span>
              <span>{date} 22:15:00 PM</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-neutral-400 my-3" />

          {/* Barcode Section */}
          <div className="flex flex-col items-center justify-center my-3">
            {/* SVG Barcode */}
            <svg
              className="w-48 sm:w-56 h-11"
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
            <div className="font-mono text-[10px] tracking-[0.25em] text-neutral-800 mt-1">
              7 39281 04729 3
            </div>
          </div>

          {/* Footer Receipt Info */}
          <div className="text-center text-[10px] space-y-0.5 text-neutral-600 mt-2">
            <div>OP #156 Name: {hostDisplayName}</div>
            <div className="font-bold text-neutral-800">Thank you!</div>
            <div>Please Come Again • Hẹn gặp lại buổi sau!</div>
            <div className="mt-2 text-neutral-500">
              Items Sold: {totalPlayers} người chơi
            </div>
            <div className="text-neutral-500">
              {date} • caulongratchuyen.vercel.app
            </div>
          </div>
        </div>

        {/* Bottom Serrated Edge (Jagged cut paper effect) */}
        <div className="w-full h-2.5 bg-[#fbfbfa] relative flex overflow-hidden">
          <svg
            className="w-full h-2 text-[var(--card)] fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" />
          </svg>
        </div>
      </div>

      {/* Action Buttons Toolbar Below Receipt */}
      <div className="w-full max-w-[380px] mt-3 space-y-2">
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
            <span>Lưu DB Supabase</span>
          </button>
        </div>

        {/* Print / Save receipt helper button */}
        <button
          type="button"
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[8px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>In / Lưu biên lai Costco</span>
        </button>
      </div>
    </div>
  );
}
