"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import confetti from "canvas-confetti";
import {
  Users,
  Receipt,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  QrCode,
  History as HistoryIcon,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  BookmarkPlus,
  Info,
} from "lucide-react";
import { PixelCat, PixelRacket } from "./PixelArt";
import { ThemeToggle } from "./ThemeToggle";
import { NumberInput } from "./NumberInput";
import { VietQRModal } from "./VietQRModal";
import { HistoryDrawer } from "./HistoryDrawer";
import { BadmintonData, BankConfig, HistoryItem } from "@/types";
import {
  DEFAULT_DATA,
  DEFAULT_BANK,
  getBadmintonSnapshot,
  setBadmintonState,
  subscribeBadminton,
  getBankSnapshot,
  setBankState,
  subscribeBank,
  getHistorySnapshot,
  setHistoryState,
  subscribeHistory,
} from "@/lib/store";

export function BadmintonCalculator() {
  const data = useSyncExternalStore(
    subscribeBadminton,
    getBadmintonSnapshot,
    () => DEFAULT_DATA
  );

  const bankConfig = useSyncExternalStore(
    subscribeBank,
    getBankSnapshot,
    () => DEFAULT_BANK
  );

  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    () => []
  );

  const [copied, setCopied] = useState(false);
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculations
  const calculations = useMemo(() => {
    const tongTienSan = (Number(data.tienSan) || 0) * 1000;
    const tongTienCau =
      (Number(data.soQua) || 0) * (Number(data.giaQua) || 0) * 1000;
    const tongTienNuoc = (Number(data.tienNuoc) || 0) * 1000;

    const tongChiPhi = tongTienSan + tongTienCau + tongTienNuoc;

    const namCount = Number(data.nam) || 0;
    const nuCount = Number(data.nu) || 0;
    const ratio = data.femaleRatio || 0.75;
    const mauSo = namCount + ratio * nuCount;

    let rawNam = 0;
    let rawNu = 0;

    if (mauSo > 0) {
      rawNam = tongChiPhi / mauSo;
      rawNu = ratio * rawNam;
    }

    // Rounding options
    const roundNumber = (num: number) => {
      if (!isFinite(num) || isNaN(num)) return 0;
      if (data.roundMode === "1k") {
        return Math.round(num / 1000) * 1000;
      }
      if (data.roundMode === "5k") {
        return Math.round(num / 5000) * 5000;
      }
      return Math.round(num);
    };

    const finalNam = roundNumber(rawNam);
    const finalNu = roundNumber(rawNu);

    return {
      tongTienSan,
      tongTienCau,
      tongTienNuoc,
      tongChiPhi,
      mauSo,
      finalNam,
      finalNu,
      namCount,
      nuCount,
      ratio,
    };
  }, [data]);

  const updateField = <K extends keyof BadmintonData>(
    field: K,
    val: BadmintonData[K]
  ) => {
    setBadmintonState((prev) => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    if (window.confirm("Đặt lại toàn bộ về mặc định?")) {
      setBadmintonState(DEFAULT_DATA);
    }
  };

  const handleSaveBankConfig = (cfg: BankConfig) => {
    setBankState(cfg);
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  // Generate share text for group chat
  const generateShareMessage = () => {
    const today = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let msg = `🏸 CẦU LÔNG RẤT CHUYÊN 🏸\n`;
    msg += `📅 Ngày: ${today}\n\n`;
    msg += `👥 Người chơi (${calculations.namCount + calculations.nuCount} bạn):\n`;
    msg += `• ${calculations.namCount} Nam\n`;
    msg += `• ${calculations.nuCount} Nữ\n\n`;

    msg += `💰 Chi phí buổi chơi:\n`;
    msg += `• Sân: ${calculations.tongTienSan.toLocaleString("vi-VN")} đ\n`;
    msg += `• Cầu: ${data.soQua} quả x ${(data.giaQua * 1000).toLocaleString("vi-VN")} đ = ${calculations.tongTienCau.toLocaleString("vi-VN")} đ\n`;
    msg += `• Nước: ${calculations.tongTienNuoc.toLocaleString("vi-VN")} đ\n`;
    msg += `👉 TỔNG CỘNG: ${calculations.tongChiPhi.toLocaleString("vi-VN")} đ\n\n`;

    msg += `💵 KẾT QUẢ CHIA TIỀN:\n`;
    msg += `👉 Mỗi Nam: ${calculations.finalNam.toLocaleString("vi-VN")} đ\n`;
    msg += `👉 Mỗi Nữ: ${calculations.finalNu.toLocaleString("vi-VN")} đ${
      calculations.ratio !== 1
        ? ` (giảm ${Math.round((1 - calculations.ratio) * 100)}%)`
        : ""
    }\n`;

    if (data.noteNam?.trim()) {
      msg += `\n📝 Nam: ${data.noteNam.trim()}`;
    }
    if (data.noteNu?.trim()) {
      msg += `\n📝 Nữ: ${data.noteNu.trim()}`;
    }

    if (bankConfig.enabled && bankConfig.accountNo) {
      msg += `\n\n💳 Chuyển khoản:\n• STK: ${bankConfig.accountNo} (${bankConfig.bankId})\n• Tên: ${bankConfig.accountName}`;
    }

    msg += `\n\n🔗 caulongratchuyen.vercel.app`;
    return msg;
  };

  const handleCopy = async () => {
    const text = generateShareMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      fireConfetti();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      fireConfetti();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    const text = generateShareMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cầu Lông Rất Chuyên - Tính tiền chia",
          text: text,
        });
        fireConfetti();
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleSaveToHistory = () => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      totalCost: calculations.tongChiPhi,
      costPerMale: calculations.finalNam,
      costPerFemale: calculations.finalNu,
      maleCount: calculations.namCount,
      femaleCount: calculations.nuCount,
      courtCost: calculations.tongTienSan,
      shuttleCost: calculations.tongTienCau,
      waterCost: calculations.tongTienNuoc,
      notes: [data.noteNam, data.noteNu].filter(Boolean).join(" | "),
    };

    const updated = [newItem, ...history];
    setHistoryState(updated);
    fireConfetti();
    alert("Đã lưu buổi chơi vào Lịch sử!");
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistoryState(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm("Xóa toàn bộ lịch sử các buổi chơi?")) {
      setHistoryState([]);
    }
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setBadmintonState((prev) => ({
      ...prev,
      nam: item.maleCount,
      nu: item.femaleCount,
      tienSan: Math.round(item.courtCost / 1000),
      soQua: 4,
      giaQua:
        item.shuttleCost > 0
          ? Math.round(item.shuttleCost / 4 / 1000)
          : prev.giaQua,
      tienNuoc: Math.round(item.waterCost / 1000),
    }));
    setIsHistoryOpen(false);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-6 sm:py-10 pb-16">
      {/* Top Bar with Mascots & Actions */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Action buttons (Reset, History) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
              title="Lịch sử các buổi chơi"
              aria-label="Lịch sử"
            >
              <HistoryIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
              title="Đặt lại về mặc định"
              aria-label="Đặt lại mặc định"
            >
              <RotateCcw className="w-4 h-4 text-slate-500 hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsVietQROpen(true)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
              title="Tạo mã VietQR nhận tiền"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden xs:inline">Mã QR</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mascot & Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="hover:scale-110 transition-transform">
              <PixelCat className="w-9 h-9 drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 dark:from-blue-400 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-transparent select-none">
              Cầu Lông Rất Chuyên
            </h1>
            <div className="hover:scale-110 transition-transform">
              <PixelRacket className="w-7 h-10 drop-shadow-sm" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Tính tiền chia sau mỗi buổi chơi công bằng &amp; nhanh gọn
          </p>
        </div>
      </header>

      {/* Main Content Form */}
      <div className="space-y-4">
        {/* Card: Người chơi */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Người chơi
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Tổng {calculations.namCount + calculations.nuCount} bạn
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              id="nam"
              label="Số Nam"
              value={data.nam}
              min={0}
              step={1}
              unit="bạn"
              onChange={(val) => updateField("nam", val)}
            />
            <NumberInput
              id="nu"
              label="Số Nữ"
              value={data.nu}
              min={0}
              step={1}
              unit="bạn"
              onChange={(val) => updateField("nu", val)}
            />
          </div>
        </section>

        {/* Card: Chi phí */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Chi phí buổi chơi
              </h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Đơn vị: x1.000 đ
            </span>
          </div>

          <div className="space-y-3">
            <NumberInput
              id="tienSan"
              label="Tiền sân"
              hint="VD: 520k = 520"
              value={data.tienSan}
              min={0}
              step={10}
              unit="k"
              onChange={(val) => updateField("tienSan", val)}
            />

            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="soQua"
                label="Số quả cầu"
                value={data.soQua}
                min={0}
                step={1}
                unit="quả"
                onChange={(val) => updateField("soQua", val)}
              />
              <NumberInput
                id="giaQua"
                label="Giá 1 quả"
                hint="VD: 28k"
                value={data.giaQua}
                min={0}
                step={1}
                unit="k"
                onChange={(val) => updateField("giaQua", val)}
              />
            </div>

            <NumberInput
              id="tienNuoc"
              label="Tiền nước / phụ phí"
              hint="VD: 50k"
              value={data.tienNuoc}
              min={0}
              step={5}
              unit="k"
              onChange={(val) => updateField("tienNuoc", val)}
            />
          </div>

          {/* Quick toggle for advanced settings (discount ratio, rounding) */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Tỉ lệ nữ &amp; làm tròn tiền
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Female Ratio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Mức đóng Nữ so với Nam
                    </span>
                    <span className="font-bold text-pink-600 dark:text-pink-400">
                      {Math.round(data.femaleRatio * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: 0.75, label: "75% (Chuẩn)" },
                      { val: 0.8, label: "80%" },
                      { val: 0.5, label: "50%" },
                      { val: 1.0, label: "100% (Đều)" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateField("femaleRatio", opt.val)}
                        className={`py-1 px-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                          data.femaleRatio === opt.val
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Round Mode */}
                <div>
                  <span className="block text-xs text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                    Làm tròn tiền
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "exact", label: "Chuẩn xác" },
                      { key: "1k", label: "Tròn 1k" },
                      { key: "5k", label: "Tròn 5k" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() =>
                          updateField(
                            "roundMode",
                            m.key as BadmintonData["roundMode"]
                          )
                        }
                        className={`py-1 px-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                          data.roundMode === m.key
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Card: Kết quả */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kết quả chia tiền
              </h2>
            </div>
            {calculations.mauSo === 0 && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Chưa có người chơi
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Mỗi Nam trả */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div>
                <span className="block text-xs font-semibold text-blue-700 dark:text-blue-300">
                  Mỗi Nam trả
                </span>
                <span className="text-[11px] text-blue-500/80 dark:text-blue-400/80">
                  {calculations.namCount} bạn nam
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {calculations.finalNam.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Mỗi Nữ trả */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50/60 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50">
              <div>
                <span className="block text-xs font-semibold text-pink-700 dark:text-pink-300">
                  Mỗi Nữ trả
                </span>
                <span className="text-[11px] text-pink-500/80 dark:text-pink-400/80">
                  {calculations.nuCount} bạn nữ (
                  {Math.round(calculations.ratio * 100)}%)
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-pink-600 dark:text-pink-400">
                  {calculations.finalNu.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Tổng chi phí */}
            <div className="pt-2 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between px-1">
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Tổng chi phí
                </span>
                <div className="text-[10px] text-slate-400">
                  Sân + Cầu ({data.soQua} quả) + Nước
                </div>
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {calculations.tongChiPhi.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Action buttons: Copy & Share */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 animate-in zoom-in-50" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Zalo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-blue-500" />
              <span>Chia sẻ</span>
            </button>
          </div>

          {/* Save to History Button */}
          <button
            type="button"
            onClick={handleSaveToHistory}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 font-medium text-xs transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Lưu buổi chơi này vào Lịch sử</span>
          </button>
        </section>

        {/* Card: Ghi chú */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ghi chú danh sách
          </h2>

          <div>
            <label
              htmlFor="noteNam"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Note: Tên các bạn Nam
            </label>
            <textarea
              id="noteNam"
              rows={2}
              value={data.noteNam}
              placeholder="VD: Tuấn, Dũng, Hoàng, Nam..."
              onChange={(e) => updateField("noteNam", e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors resize-y min-h-[50px]"
            />
          </div>

          <div>
            <label
              htmlFor="noteNu"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Note: Tên các bạn Nữ
            </label>
            <textarea
              id="noteNu"
              rows={2}
              value={data.noteNu}
              placeholder="VD: Lan, Mai, Trang..."
              onChange={(e) => updateField("noteNu", e.target.value)}
              className="w-full py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors resize-y min-h-[50px]"
            />
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p>Cầu Lông Rất Chuyên • Hỗ trợ lưu trữ offline &amp; tự động lưu</p>
        <p className="text-[11px]">
          Công thức: Tiền Nam = Tổng / (Nam + 0.75 * Nữ) • Tiền Nữ = 75% Nam
        </p>
      </footer>

      {/* VietQR Modal */}
      <VietQRModal
        isOpen={isVietQROpen}
        onClose={() => setIsVietQROpen(false)}
        bankConfig={bankConfig}
        onSaveBankConfig={handleSaveBankConfig}
        amountNam={calculations.finalNam}
        amountNu={calculations.finalNu}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
        onRestore={handleRestoreHistory}
      />
    </div>
  );
}
