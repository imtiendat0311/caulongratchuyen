"use client";

import React, { useState } from "react";
import { QrCode, X, Copy, Check, ExternalLink } from "lucide-react";
import { BankConfig } from "@/types";

const POPULAR_BANKS = [
  { id: "MB", name: "MB Bank (Quân Đội)" },
  { id: "VCB", name: "Vietcombank" },
  { id: "TCB", name: "Techcombank" },
  { id: "VPB", name: "VPBank" },
  { id: "TPB", name: "TPBank" },
  { id: "ACB", name: "ACB" },
  { id: "BIDV", name: "BIDV" },
  { id: "ICB", name: "VietinBank" },
  { id: "STB", name: "Sacombank" },
  { id: "VIB", name: "VIB" },
  { id: "SHB", name: "SHB" },
];

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankConfig: BankConfig;
  onSaveBankConfig: (cfg: BankConfig) => void;
  amountNam: number;
  amountNu: number;
}

export function VietQRModal({
  isOpen,
  onClose,
  bankConfig,
  onSaveBankConfig,
  amountNam,
  amountNu,
}: VietQRModalProps) {
  const [bankId, setBankId] = useState(bankConfig.bankId || "MB");
  const [accountNo, setAccountNo] = useState(bankConfig.accountNo || "");
  const [accountName, setAccountName] = useState(bankConfig.accountName || "");
  const [selectedGender, setSelectedGender] = useState<"nam" | "nu">("nam");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAmount = selectedGender === "nam" ? amountNam : amountNu;
  const description = `Cau long ${selectedGender === "nam" ? "Nam" : "Nu"}`;

  const qrUrl =
    bankId && accountNo
      ? `https://img.vietqr.io/image/${bankId}-${accountNo.trim()}-compact2.png?amount=${Math.round(
          currentAmount
        )}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(
          accountName.trim()
        )}`
      : null;


  const handleCopyAcc = () => {
    if (!accountNo) return;
    navigator.clipboard.writeText(`${accountNo} - ${bankId} (${accountName})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">
              Mã VietQR Nhận Tiền
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quét mã ngân hàng để các bạn chuyển khoản nhanh
            </p>
          </div>
        </div>

        {/* Bank Config Form */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Ngân hàng
              </label>
              <select
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value);
                  onSaveBankConfig({ ...bankConfig, bankId: e.target.value });
                }}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Số tài khoản
              </label>
              <input
                type="text"
                value={accountNo}
                placeholder="VD: 0988..."
                onChange={(e) => {
                  setAccountNo(e.target.value);
                  onSaveBankConfig({
                    ...bankConfig,
                    accountNo: e.target.value.trim(),
                  });
                }}
                className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Tên chủ tài khoản (không dấu)
            </label>
            <input
              type="text"
              value={accountName}
              placeholder="VD: NGUYEN VAN A"
              onChange={(e) => {
                setAccountName(e.target.value);
                onSaveBankConfig({
                  ...bankConfig,
                  accountName: e.target.value.trim().toUpperCase(),
                });
              }}
              className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 uppercase"
            />
          </div>
        </div>

        {/* Gender selector for QR amount */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-3">
          <button
            type="button"
            onClick={() => setSelectedGender("nam")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === "nam"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Nam: {Math.round(amountNam).toLocaleString("vi-VN")} đ
          </button>
          <button
            type="button"
            onClick={() => setSelectedGender("nu")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedGender === "nu"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Nữ: {Math.round(amountNu).toLocaleString("vi-VN")} đ
          </button>
        </div>

        {/* QR Display */}
        {qrUrl ? (
          <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-white rounded-xl border border-slate-200 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Mã VietQR Chuyển khoản"
              className="w-48 h-auto object-contain rounded-lg"
              loading="lazy"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCopyAcc}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-100 px-2 py-1 rounded-md transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Đã chép STK" : "Sao chép STK"}
              </button>
              <a
                href={qrUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-100 px-2 py-1 rounded-md transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Mở ảnh lớn
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Vui lòng nhập Số tài khoản để hiển thị mã QR
          </div>
        )}
      </div>
    </div>
  );
}
