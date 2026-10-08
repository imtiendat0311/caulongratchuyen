"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building2,
  ExternalLink,
} from "lucide-react";
import { PRESET_COURTS, BadmintonCourt } from "@/types";

interface CourtPickerAndMapProps {
  courtName: string;
  courtAddress: string;
  courtNumber: string;
  onCourtChange: (name: string, address: string, courtNumber?: string) => void;
}

export function CourtPickerAndMap({
  courtName,
  courtAddress,
  courtNumber,
  onCourtChange,
}: CourtPickerAndMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  // Custom court form fields
  const [customName, setCustomName] = useState(courtName);
  const [customAddress, setCustomAddress] = useState(courtAddress);

  // Common court numbers
  const courtNumbersList = ["Sân 1", "Sân 2", "Sân 3", "Sân 4", "Sân 5", "Sân 6"];

  const handleSelectPreset = (court: BadmintonCourt) => {
    setIsCustomMode(false);
    onCourtChange(court.name, court.address, courtNumber || court.courtNumber || "Sân 1");
  };

  const handleSelectCourtNumber = (num: string) => {
    onCourtChange(courtName, courtAddress, num);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onCourtChange(
      customName.trim(),
      customAddress.trim() || customName.trim(),
      courtNumber || "Sân 1"
    );
  };

  const handleCopyAddress = () => {
    if (!courtAddress) return;
    navigator.clipboard.writeText(`${courtName} - ${courtAddress} (${courtNumber})`);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  // Query string for embedded maps
  const mapSearchQuery = encodeURIComponent(
    `${courtName} ${courtAddress}`.trim() || "115 Quán Thánh Ba Đình Hà Nội"
  );
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapSearchQuery}`;

  return (
    <section className="app-card p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-[0.9rem] font-bold uppercase tracking-wider text-[var(--text)] m-0 flex items-center gap-1.5">
              <span>Sân Thi Đấu &amp; Địa Chỉ</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                {courtNumber || "Sân 1"}
              </span>
            </h2>
            <p className="text-[11px] text-[var(--muted)]">
              Chọn sân thi đấu để in địa chỉ chuẩn lên hoá đơn Costco
            </p>
          </div>
        </div>

        {/* Toggle map preview button */}
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>{showMap ? "Thu gọn bản đồ" : "Xem bản đồ"}</span>
          {showMap ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Preset Court Selector Dropdown & Chips */}
      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
            Chọn sân cầu lông:
          </label>
          <div className="flex gap-2">
            <select
              value={isCustomMode ? "custom" : (PRESET_COURTS.find((c) => c.name === courtName)?.id || "custom")}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomMode(true);
                  setCustomName(courtName);
                  setCustomAddress(courtAddress);
                } else {
                  const found = PRESET_COURTS.find((c) => c.id === e.target.value);
                  if (found) handleSelectPreset(found);
                }
              }}
              className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-[10px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {PRESET_COURTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.address.split(",")[0]})
                </option>
              ))}
              <option value="custom">✏️ Nhập sân khác...</option>
            </select>
          </div>
        </div>

        {/* Custom Court Form if custom mode active */}
        {isCustomMode && (
          <form
            onSubmit={handleSaveCustom}
            className="p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2 animate-in fade-in"
          >
            <div className="text-[11px] font-bold text-[var(--accent)]">
              Nhập thông tin sân mới:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tên sân (VD: Sân Cầu Lông Long Biên)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
              />
              <input
                type="text"
                placeholder="Địa chỉ cụ thể (VD: 123 Nguyễn Văn Cừ, Hà Nội)"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="py-1 px-2.5 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="py-1 px-3 rounded-[8px] bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer hover:opacity-90"
              >
                Áp dụng sân này
              </button>
            </div>
          </form>
        )}

        {/* Court Number (What Court) Chips */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1.5">
            Sân số mấy (What court):
          </label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {courtNumbersList.map((num) => {
              const isSelected = courtNumber === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectCourtNumber(num)}
                  className={`py-1 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-emerald-500"
                  }`}
                >
                  {num}
                </button>
              );
            })}

            {/* Custom court number input */}
            <input
              type="text"
              placeholder="Khác: Sân 3&4..."
              value={courtNumbersList.includes(courtNumber) ? "" : courtNumber}
              onChange={(e) => onCourtChange(courtName, courtAddress, e.target.value)}
              className="py-1 px-2 text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none max-w-[110px]"
            />
          </div>
        </div>

        {/* Current Active Court Banner */}
        <div className="p-2.5 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-[var(--text)] truncate">
                {courtName} ({courtNumber || "Sân 1"})
              </div>
              <div className="text-[11px] text-[var(--muted)] truncate">
                {courtAddress}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyAddress}
              className="py-1 px-2 text-[11px] rounded-[8px] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] text-[var(--text)] transition-colors cursor-pointer flex items-center gap-1"
              title="Sao chép địa chỉ sân"
            >
              {copiedAddr ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-[var(--muted)]" />
              )}
              <span>{copiedAddr ? "Đã chép" : "Chép địa chỉ"}</span>
            </button>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="py-1 px-2.5 text-[11px] rounded-[8px] bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors flex items-center gap-1 shadow-xs"
            >
              <Navigation className="w-3 h-3" />
              <span>Chỉ đường</span>
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Google Maps View */}
      {showMap && (
        <div className="pt-2 animate-in fade-in duration-200">
          <div className="relative rounded-[14px] overflow-hidden border border-[var(--border)] shadow-sm bg-neutral-900 h-48 sm:h-56 w-full">
            <iframe
              title={`Bản đồ ${courtName}`}
              className="w-full h-full border-0"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${mapSearchQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Quick floating directions badge */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2.5 right-2.5 py-1 px-2.5 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs border border-white/20 transition-all shadow-md"
            >
              <ExternalLink className="w-3 h-3 text-rose-400" />
              <span>Mở Google Maps</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
