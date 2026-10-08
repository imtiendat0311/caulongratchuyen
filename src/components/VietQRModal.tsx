"use client";

import React, { useState } from "react";
import { QrCode, X, Copy, Check, ExternalLink, Crown, ChevronDown } from "lucide-react";
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
  if (!isOpen) return null;

  return (
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

  const handleCopyAcc = () => {
    if (!accountNo) return;
    navigator.clipboard.writeText(`${accountNo} - ${bankId} (${accountName})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] p-5 text-[var(--text)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

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
            <button
              type="button"
              onClick={() => setSelectedGender("nam")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                selectedGender === "nam"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Nam: {Math.round(amountNam).toLocaleString("vi-VN")} đ
            </button>
            <button
              type="button"
              onClick={() => setSelectedGender("nu")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                selectedGender === "nu"
                  ? "bg-[var(--female)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Nữ: {Math.round(amountNu).toLocaleString("vi-VN")} đ
            </button>
          </div>

          {/* QR Display */}
          {qrUrl ? (
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-[12px] border border-[var(--border)] shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Mã VietQR Chuyển khoản"
                className="w-44 sm:w-48 h-auto object-contain rounded-lg"
                loading="lazy"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCopyAcc}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
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
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Mở ảnh lớn
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[var(--muted)] bg-[var(--bg)] rounded-[10px] border border-dashed border-[var(--border)]">
              Vui lòng nhập Số tài khoản để hiển thị mã QR
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
