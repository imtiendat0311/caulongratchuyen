"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Plus,
  Calculator,
  Layers,
  MapPin,
} from "lucide-react";
import { PRESET_COURTS, BadmintonCourt } from "@/types";

// Dynamically import ElegantCourtMap to avoid any SSR issues with Leaflet
const ElegantCourtMap = dynamic(() => import("./ElegantCourtMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 sm:h-56 w-full rounded-[16px] bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-xs text-[var(--muted)] animate-pulse gap-2">
      <MapPin className="w-5 h-5 text-emerald-500 animate-bounce" />
      <span>Đang tải bản đồ sân thi đấu...</span>
    </div>
  ),
});

export function parseCourtsList(courtStr: string): string[] {
  if (!courtStr) return [];
  const rawParts = courtStr
    .replace(/^(\d+)\s*sân[:\s]*/i, "")
    .split(/[,+&]| và | and /i)
    .map((s) => s.trim())
    .filter(Boolean);

  return rawParts.map((s) => {
    if (/^\d+$/.test(s)) return `Sân ${s}`;
    return s;
  });
}

export function formatCourtsList(courts: string[]): string {
  if (courts.length === 0) return "Sân 1, Sân 2";
  const unique = Array.from(new Set(courts));
  unique.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  return unique.join(", ");
}

interface CourtPickerAndMapProps {
  courtName: string;
  courtAddress: string;
  courtNumber: string;
  onCourtChange: (name: string, address: string, courtNumber?: string) => void;
  onApplyCourtCost?: (cost: number) => void;
}

export function CourtPickerAndMap({
  courtName,
  courtAddress,
  courtNumber,
  onCourtChange,
  onApplyCourtCost,
}: CourtPickerAndMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [newCourtInput, setNewCourtInput] = useState("");
  const [showAddCourtForm, setShowAddCourtForm] = useState(false);

  // Custom court form fields
  const [customName, setCustomName] = useState(courtName);
  const [customAddress, setCustomAddress] = useState(courtAddress);

  // Available court numbers pool
  const [courtPool, setCourtPool] = useState<string[]>([
    "Sân 1",
    "Sân 2",
    "Sân 3",
    "Sân 4",
    "Sân 5",
    "Sân 6",
    "Sân 7",
    "Sân 8",
  ]);

  // Currently selected courts
  const selectedCourts = useMemo(() => {
    const list = parseCourtsList(courtNumber);
    return list.length > 0 ? list : ["Sân 1", "Sân 2"];
  }, [courtNumber]);

  const courtsCount = selectedCourts.length;

  // Auto-merge any existing courts in courtNumber into pool
  const allCourtChips = useMemo(() => {
    const set = new Set(courtPool);
    selectedCourts.forEach((c) => set.add(c));
    const arr = Array.from(set);
    arr.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
    return arr;
  }, [courtPool, selectedCourts]);

  const handleSelectPreset = (court: BadmintonCourt) => {
    setIsCustomMode(false);
    onCourtChange(
      court.name,
      court.address,
      courtNumber || court.courtNumber || "Sân 1, Sân 2"
    );
  };

  const handleToggleCourt = (courtItem: string) => {
    let next: string[];
    if (selectedCourts.includes(courtItem)) {
      if (selectedCourts.length <= 1) {
        return; // Keep at least 1 court selected
      }
      next = selectedCourts.filter((c) => c !== courtItem);
    } else {
      next = [...selectedCourts, courtItem];
    }
    const formatted = formatCourtsList(next);
    onCourtChange(courtName, courtAddress, formatted);
  };

  const handleSelectQuickPreset = (presetCourts: string) => {
    onCourtChange(courtName, courtAddress, presetCourts);
  };

  const handleAddNewCourtChip = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCourtInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.startsWith("Sân") ? trimmed : `Sân ${trimmed}`;
    if (!courtPool.includes(formatted)) {
      setCourtPool((prev) => [...prev, formatted]);
    }
    if (!selectedCourts.includes(formatted)) {
      const next = [...selectedCourts, formatted];
      onCourtChange(courtName, courtAddress, formatCourtsList(next));
    }
    setNewCourtInput("");
    setShowAddCourtForm(false);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onCourtChange(
      customName.trim(),
      customAddress.trim() || customName.trim(),
      courtNumber || "Sân 1, Sân 2"
    );
  };

  const suggestedCourtRent = courtsCount * 2 * 130;

  return (
    <section className="app-card p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-[0.9rem] font-bold uppercase tracking-wider text-[var(--text)] m-0 flex items-center gap-1.5 flex-wrap">
              <span>Sân Thi Đấu &amp; Địa Chỉ</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                <Layers className="w-3 h-3" />
                <span>
                  {courtsCount} Sân: {courtNumber || "Sân 1, Sân 2"}
                </span>
              </span>
            </h2>
            <p className="text-[11px] text-[var(--muted)]">
              Chọn sân thi đấu &amp; số lượng sân thuê để tính tiền chuẩn
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

      {/* Preset Court Selector Dropdown */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
            Chọn địa điểm sân cầu lông:
          </label>
          <div className="flex gap-2">
            <select
              value={
                isCustomMode
                  ? "custom"
                  : PRESET_COURTS.find((c) => c.name === courtName)?.id || "custom"
              }
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

        {/* Multi-court Selection Section */}
        <div className="p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-[11px] font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>Sân số mấy (Thuê nhiều sân cùng lúc):</span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Đang chọn: {courtsCount} sân
              </span>
            </label>
            <span className="text-[10px] text-[var(--muted)]">
              Nhấn để chọn/bỏ chọn từng sân
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-semibold text-[var(--muted)]">
              Gợi ý nhanh:
            </span>
            <button
              type="button"
              onClick={() => handleSelectQuickPreset("Sân 1, Sân 2")}
              className={`py-0.5 px-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                courtNumber === "Sân 1, Sân 2"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              ⚡ 2 Sân (1 &amp; 2)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickPreset("Sân 3, Sân 4")}
              className={`py-0.5 px-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                courtNumber === "Sân 3, Sân 4"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              ⚡ 2 Sân (3 &amp; 4)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickPreset("Sân 5, Sân 6")}
              className={`py-0.5 px-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                courtNumber === "Sân 5, Sân 6"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              ⚡ 2 Sân (5 &amp; 6)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickPreset("Sân 1")}
              className={`py-0.5 px-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                courtNumber === "Sân 1"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              1 Sân (Sân 1)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickPreset("Sân 1, Sân 2, Sân 3")}
              className={`py-0.5 px-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                courtNumber === "Sân 1, Sân 2, Sân 3"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              3 Sân (1, 2, 3)
            </button>
          </div>

          {/* Interactive Multi-Select Chips */}
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            {allCourtChips.map((num) => {
              const isSelected = selectedCourts.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleToggleCourt(num)}
                  className={`py-1 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs scale-102"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-emerald-500"
                  }`}
                >
                  <span>{num}</span>
                </button>
              );
            })}

            {/* Button to toggle add court input */}
            {!showAddCourtForm ? (
              <button
                type="button"
                onClick={() => setShowAddCourtForm(true)}
                className="py-1 px-2.5 rounded-full text-xs font-medium border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm sân</span>
              </button>
            ) : (
              <form onSubmit={handleAddNewCourtChip} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="VD: 9 hoặc VIP 1"
                  autoFocus
                  value={newCourtInput}
                  onChange={(e) => setNewCourtInput(e.target.value)}
                  className="py-0.5 px-2 text-xs rounded-full border border-[var(--accent)] bg-[var(--card)] text-[var(--text)] outline-none w-28"
                />
                <button
                  type="submit"
                  className="py-0.5 px-2 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold cursor-pointer"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCourtForm(false)}
                  className="py-0.5 px-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          {/* Direct Text Edit for Custom String */}
          <div className="pt-1 flex items-center gap-2">
            <span className="text-[10px] text-[var(--muted)] shrink-0">
              Chuỗi hiển thị:
            </span>
            <input
              type="text"
              placeholder="VD: Sân 1, Sân 2 hoặc Sân 3 & 4"
              value={courtNumber}
              onChange={(e) => onCourtChange(courtName, courtAddress, e.target.value)}
              className="flex-1 py-1 px-2.5 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)] font-medium"
            />
          </div>

          {/* Quick Rent Cost Calculator Bar */}
          {onApplyCourtCost && (
            <div className="pt-1.5 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Gợi ý tiền sân: <strong>{courtsCount} sân</strong> × 2h × 130k/h ={" "}
                  <strong className="text-[var(--text)]">
                    {suggestedCourtRent}k
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onApplyCourtCost(suggestedCourtRent)}
                className="py-1 px-2.5 rounded-[6px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Áp dụng {suggestedCourtRent}k</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Elegant Leaflet Map Component (Minimalist, Dark/Light aware, zero clunky overlays) */}
      {showMap && (
        <div className="pt-2 animate-in fade-in duration-200">
          <ElegantCourtMap
            courtName={courtName}
            courtAddress={courtAddress}
            courtNumber={courtNumber}
          />
        </div>
      )}
    </section>
  );
}
