"use client";

import React, { useState, useMemo, useSyncExternalStore, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Share2,
  Copy,
  Check,
  RotateCcw,
  QrCode,
  History as HistoryIcon,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  BookmarkPlus,
  ArrowUpRight,
  Cloud,
  CloudCheck,
  RefreshCw,
  Calendar,
  UserCheck,
  UserPlus,
  Plus,
  X,
  User,
  Crown,
  CreditCard,
  Camera,
  Trophy,
} from "lucide-react";
import { PixelCat, PixelRacket } from "./PixelArt";
import { ThemeToggle } from "./ThemeToggle";
import { NumberInput } from "./NumberInput";
import { VietQRModal } from "./VietQRModal";
import { HistoryDrawer } from "./HistoryDrawer";
import { MemberManagerModal } from "./MemberManagerModal";
import { TeamPhotoModal } from "./TeamPhotoModal";
import { BadmintonData, BankConfig, HistoryItem } from "@/types";
import {
  DEFAULT_DATA,
  DEFAULT_BANK,
  getTodayDateString,
  getCurrentMonthString,
  getBadmintonSnapshot,
  setBadmintonState,
  subscribeBadminton,
  getBankSnapshot,
  setBankState,
  subscribeBank,
  getHistorySnapshot,
  subscribeHistory,
  getMembersSnapshot,
  subscribeMembers,
  getMonthlyHostsSnapshot,
  subscribeMonthlyHosts,
  setMonthlyHost,
  setDailyHost,
  updateMemberBank,
  getSyncStatusSnapshot,
  subscribeSyncStatus,
  initSupabaseSync,
  addHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  addMember,
  deleteMember,
  toggleAttendee,
  selectAllAttendees,
  clearAllAttendees,
  addGuestAttendee,
  removeGuestAttendee,
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

  const members = useSyncExternalStore(
    subscribeMembers,
    getMembersSnapshot,
    () => []
  );

  const monthlyHosts = useSyncExternalStore(
    subscribeMonthlyHosts,
    getMonthlyHostsSnapshot,
    (): Record<string, string> => ({})
  );

  const syncStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    () => "idle"
  );

  const [copied, setCopied] = useState(false);
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTeamPhotoOpen, setIsTeamPhotoOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // New guest state for single-day attendance
  const [guestName, setGuestName] = useState("");
  const [guestGender, setGuestGender] = useState<"male" | "female">("male");

  // Initialize Supabase sync on client mount
  useEffect(() => {
    initSupabaseSync();
    if (!getBadmintonSnapshot().matchDate) {
      const today = getTodayDateString();
      if (today) {
        setBadmintonState((prev) => ({
          ...prev,
          matchDate: prev.matchDate || today,
        }));
      }
    }
  }, []);

  // Format date helper: YYYY-MM-DD -> DD/MM/YYYY
  const displayDate = useMemo(() => {
    if (!data.matchDate) return "";
    const parts = data.matchDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return data.matchDate;
  }, [data.matchDate]);

  // Current month in YYYY-MM (e.g. "2026-10")
  const currentMonth = useMemo(() => {
    if (data.matchDate) {
      return data.matchDate.slice(0, 7);
    }
    return getCurrentMonthString();
  }, [data.matchDate]);

  // Format month MM/YYYY
  const displayMonth = useMemo(() => {
    if (!currentMonth) return "";
    const parts = currentMonth.split("-");
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
    return currentMonth;
  }, [currentMonth]);

  // Monthly default host ID for this month
  const monthlyHostId = monthlyHosts[currentMonth] || "";
  const monthlyHostMember = useMemo(
    () => members.find((m) => m.id === monthlyHostId),
    [members, monthlyHostId]
  );

  // Active host for today: daily override if set -> data.hostMemberId, else monthly host, else first member
  const activeHostId =
    data.hostMemberId || monthlyHostId || (members[0]?.id ?? "");
  const activeHostMember = useMemo(
    () => members.find((m) => m.id === activeHostId),
    [members, activeHostId]
  );

  const isHostOverridden = Boolean(
    data.hostMemberId && data.hostMemberId !== monthlyHostId
  );

  // Effective bank config prioritizing active host's bank info
  const effectiveBankConfig = useMemo((): BankConfig => {
    if (activeHostMember?.account_no) {
      return {
        bankId: activeHostMember.bank_id || "MB",
        accountNo: activeHostMember.account_no,
        accountName:
          activeHostMember.account_name || activeHostMember.name.toUpperCase(),
        enabled: true,
      };
    }
    return bankConfig;
  }, [activeHostMember, bankConfig]);

  const handleDailyHostChange = (newHostId: string) => {
    if (!newHostId || newHostId === monthlyHostId) {
      setDailyHost("");
    } else {
      setDailyHost(newHostId);
    }
  };

  const handleMonthlyHostChange = async (month: string, newHostId: string) => {
    await setMonthlyHost(month, newHostId);
  };

  // Calculations exactly matching original HTML
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
      setBadmintonState({
        ...DEFAULT_DATA,
        matchDate: getTodayDateString(),
      });
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

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    addGuestAttendee(guestName, guestGender);
    setGuestName("");
  };

  const generateShareMessage = () => {
    let msg = `🏸 CẦU LÔNG RẤT CHUYÊN 🏸\n`;
    msg += `📅 Ngày: ${displayDate}\n`;
    if (activeHostMember) {
      msg += `👑 Chủ xị nhận tiền: ${activeHostMember.name}${
        isHostOverridden
          ? " (thay đổi riêng hôm nay)"
          : displayMonth
          ? ` (Chủ xị T${displayMonth})`
          : ""
      }\n`;
    }
    msg += `\n👥 Người chơi (${calculations.namCount + calculations.nuCount} bạn):\n`;
    msg += `• ${calculations.namCount} Nam${data.noteNam ? `: ${data.noteNam}` : ""}\n`;
    msg += `• ${calculations.nuCount} Nữ${data.noteNu ? `: ${data.noteNu}` : ""}\n\n`;

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

    if (effectiveBankConfig.accountNo) {
      msg += `\n💳 Chuyển khoản cho ${activeHostMember ? activeHostMember.name : "Chủ xị"}:\n• STK: ${effectiveBankConfig.accountNo} (${effectiveBankConfig.bankId})\n• Tên: ${effectiveBankConfig.accountName}`;
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

  const handleSaveToHistory = async () => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: displayDate,
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

    await addHistoryItem(newItem);
    fireConfetti();
    alert(`Đã lưu buổi chơi ngày ${displayDate} vào cơ sở dữ liệu Supabase!`);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteHistoryItem(id);
  };

  const handleClearHistory = async () => {
    if (window.confirm("Xóa toàn bộ lịch sử các buổi chơi trên database?")) {
      await clearAllHistory();
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

  const maleMembers = useMemo(
    () => members.filter((m) => m.gender === "male"),
    [members]
  );
  const femaleMembers = useMemo(
    () => members.filter((m) => m.gender === "female"),
    [members]
  );

  const maleGuests = useMemo(
    () => (data.guests || []).filter((g) => g.gender === "male"),
    [data.guests]
  );
  const femaleGuests = useMemo(
    () => (data.guests || []).filter((g) => g.gender === "female"),
    [data.guests]
  );

  const selectedStableMembersCount = useMemo(
    () => (data.attendeeIds || []).filter((id) => members.some((m) => m.id === id)).length,
    [data.attendeeIds, members]
  );

  return (
    <div className="w-full max-w-[460px] md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 md:py-8 lg:py-10">
      {/* Header with Mascots, Title, and Action Toolbar */}
      <header className="mb-6 md:mb-8 text-center">
        {/* Team Avatar Badge */}
        <div className="flex flex-col items-center justify-center mb-2.5">
          <button
            type="button"
            onClick={() => setIsTeamPhotoOpen(true)}
            className="group relative cursor-pointer focus:outline-none"
            title="Bấm để xem ảnh kỷ niệm FC Rất Chuyên"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] rounded-full blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[var(--border)] shadow-md bg-[var(--card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/team-photo.jpg"
                alt="FC Rất Chuyên Team Avatar"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              />
            </div>
            <span className="absolute bottom-0 right-0 p-1 bg-[var(--card)] rounded-full border border-[var(--border)] shadow-xs text-[11px] group-hover:scale-110 transition-transform">
              🏸
            </span>
          </button>
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] mt-1.5 flex items-center gap-1.5">
            <span>FC Rất Chuyên</span>
            <span className="text-[var(--muted)]">•</span>
            <span className="text-[var(--muted)]">2026 Tournament</span>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-center gap-2.5 mb-1.5 flex-wrap">
          <div className="hover:scale-110 transition-transform">
            <PixelCat className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent select-none">
            Cầu Lông Rất Chuyên
          </h1>
          <div className="hover:scale-110 transition-transform">
            <PixelRacket className="w-6 h-9 sm:w-7 sm:h-10" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[var(--muted)] mb-3.5 flex-wrap">
          <span>Tính tiền chia sau mỗi buổi chơi</span>
          <span>•</span>
          {/* Cloud Sync Status Indicator */}
          <span className="inline-flex items-center gap-1 text-[11px]">
            {syncStatus === "syncing" && (
              <>
                <RefreshCw className="w-3 h-3 text-[var(--accent)] animate-spin" />
                <span className="text-[var(--accent)]">Đang lưu Cloud...</span>
              </>
            )}
            {syncStatus === "synced" && (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-[var(--accent2)]" />
                <span className="text-[var(--accent2)]">Đã đồng bộ Supabase</span>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <Cloud className="w-3 h-3 text-amber-500" />
                <span className="text-amber-500">Lưu cục bộ</span>
              </>
            )}
            {syncStatus === "idle" && (
              <>
                <Cloud className="w-3 h-3 text-[var(--muted)]" />
                <span>Cloud DB</span>
              </>
            )}
          </span>
        </div>

        {/* Compact action toolbar */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] flex-wrap justify-center">
          {/* Members manager button */}
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Quản lý danh sách thành viên cố định"
          >
            <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Thành viên cố định</span>
            {members.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[10px] font-bold text-[var(--accent)]">
                {members.length}
              </span>
            )}
          </button>

          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Lịch sử các buổi chơi"
          >
            <HistoryIcon className="w-3.5 h-3.5 text-[var(--accent2)]" />
            <span>Lịch sử</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[10px] font-bold text-[var(--accent2)]">
                {history.length}
              </span>
            )}
          </button>

          {/* QR button */}
          <button
            onClick={() => setIsVietQROpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Tạo mã VietQR nhận tiền"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Mã QR</span>
          </button>

          {/* Team Photo button */}
          <button
            onClick={() => setIsTeamPhotoOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Xem ảnh kỷ niệm giải đấu FC Rất Chuyên"
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span>Ảnh CLB</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Đặt lại về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>

          <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />

          <ThemeToggle />
        </div>
      </header>

      {/* Session & Host Information Card */}
      <div className="app-card p-3.5 mb-4 space-y-3">
        {/* Top row: Date Picker & Month info */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-[var(--bg)] text-[var(--accent)]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Ngày chơi:
            </span>
            <input
              type="date"
              value={data.matchDate}
              onChange={(e) => updateField("matchDate", e.target.value)}
              className="py-1 px-2.5 text-xs font-semibold rounded-[8px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                const today = getTodayDateString();
                if (today) updateField("matchDate", today);
              }}
              className="text-xs py-1 px-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
          </div>

          {/* Month selector / indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--muted)]">Tháng:</span>
            <span className="font-bold text-[var(--accent)] bg-[var(--bg)] px-2 py-0.5 rounded-[6px] border border-[var(--border)]">
              {displayMonth || "Hiện tại"}
            </span>
          </div>
        </div>

        {/* Host Section: Monthly Host & Daily Host Override */}
        <div className="pt-2.5 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* 1. Monthly Default Host Setting */}
          <div className="p-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Crown className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                  Chủ xị mặc định Tháng {displayMonth}
                </div>
                <div className="text-xs font-semibold text-[var(--text)] truncate">
                  {monthlyHostMember ? (
                    <span className="text-amber-500 font-bold">
                      👑 {monthlyHostMember.name}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)] italic">
                      Chưa chọn chủ xị tháng
                    </span>
                  )}
                </div>
              </div>
            </div>

            <select
              value={monthlyHostId || ""}
              onChange={(e) =>
                handleMonthlyHostChange(currentMonth, e.target.value)
              }
              className="py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-amber-500 cursor-pointer max-w-[150px] shrink-0"
              title="Chọn chủ xị mặc định cho cả tháng này"
            >
              <option value="">-- Chọn thành viên --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Today's Active Host & Override Option */}
          <div
            className={`p-2.5 rounded-[10px] border flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap ${
              isHostOverridden
                ? "bg-purple-500/10 border-purple-500/30"
                : "bg-[var(--bg)] border-[var(--border)]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isHostOverridden
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-[var(--accent)]/10 text-[var(--accent)]"
                }`}
              >
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                    Chủ xị ngày {displayDate}
                  </span>
                  {isHostOverridden ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white">
                      Đổi riêng hôm nay
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]">
                      Theo tháng
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-[var(--text)] truncate flex items-center gap-1.5">
                  {activeHostMember ? (
                    <>
                      <span className="font-bold text-[var(--accent2)]">
                        {activeHostMember.name}
                      </span>
                      {activeHostMember.account_no && (
                        <span className="text-[10px] text-[var(--muted)] font-normal hidden sm:inline">
                          ({activeHostMember.bank_id}: {activeHostMember.account_no})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[var(--muted)] italic">
                      Chưa chọn
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <select
                value={data.hostMemberId || ""}
                onChange={(e) => handleDailyHostChange(e.target.value)}
                className="py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer max-w-[140px]"
                title="Thay đổi chủ xị riêng cho buổi hôm nay nếu có sự cố cá nhân"
              >
                <option value="">
                  {monthlyHostMember
                    ? `Theo tháng (${monthlyHostMember.name})`
                    : "-- Theo tháng --"}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === monthlyHostId ? "(Chủ xị tháng)" : ""}
                  </option>
                ))}
              </select>

              {isHostOverridden && (
                <button
                  type="button"
                  onClick={() => handleDailyHostChange("")}
                  className="p-1 rounded-[6px] text-xs text-[var(--muted)] hover:text-purple-400 hover:bg-[var(--card)] cursor-pointer transition-colors"
                  title="Đặt lại về chủ xị mặc định tháng"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bank quick banner for active host */}
        {activeHostMember && (
          <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-xs text-[var(--muted)] flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>STK nhận tiền ({activeHostMember.name}):</span>
              {effectiveBankConfig.accountNo ? (
                <span className="font-semibold text-[var(--text)]">
                  {effectiveBankConfig.bankId} • {effectiveBankConfig.accountNo}{" "}
                  {effectiveBankConfig.accountName
                    ? `(${effectiveBankConfig.accountName})`
                    : ""}
                </span>
              ) : (
                <span className="text-amber-500 font-medium">Chưa lưu STK</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVietQROpen(true)}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3" />
                <span>Mã QR &amp; Cài STK</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Grid: 1 column on Mobile, 2 columns on Laptop/Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Left Column: Inputs (Người chơi, Chi phí, Ghi chú) */}
        <div className="md:col-span-7 space-y-4">
          {/* Card: Người chơi & Điểm danh thành viên & Khách ngày hôm nay */}
          <section className="app-card p-5">
            <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
              <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
                Người chơi
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(true)}
                  className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>DS thành viên ({members.length})</span>
                </button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)]">
                  Tổng {calculations.namCount + calculations.nuCount} bạn
                </span>
              </div>
            </div>

            {/* Stable Members Attendance Check Section */}
            <div className="mb-4 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5">
              <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[var(--accent2)]" />
                  Thành viên cố định đi hôm nay:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllAttendees}
                    className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Chọn hết
                  </button>
                  <span className="text-[10px] text-[var(--muted)]">|</span>
                  <button
                    type="button"
                    onClick={clearAllAttendees}
                    className="text-[11px] text-[var(--muted)] hover:text-red-500 cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                  <span className="text-[11px] font-bold text-[var(--accent2)] bg-[var(--card)] px-1.5 py-0.5 rounded-[6px] border border-[var(--border)]">
                    {selectedStableMembersCount}/{members.length}
                  </span>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-2 text-xs text-[var(--muted)]">
                  <span>Chưa có thành viên trong danh sách. </span>
                  <button
                    type="button"
                    onClick={() => setIsMemberModalOpen(true)}
                    className="text-[var(--accent)] underline cursor-pointer"
                  >
                    Bấm để thêm thành viên
                  </button>
                </div>
              ) : (
                <>
                  {/* Male attendees */}
                  {maleMembers.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5">
                        Nam ({maleMembers.filter((m) => data.attendeeIds?.includes(m.id)).length}/{maleMembers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {maleMembers.map((m) => {
                          const isSelected = data.attendeeIds?.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleAttendee(m.id)}
                              className={`py-1 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? "bg-[var(--accent)] text-white shadow-xs"
                                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              <span>{m.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Female attendees */}
                  {femaleMembers.length > 0 && (
                    <div className="pt-1.5 border-t border-[var(--border)]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--female)] mb-1.5">
                        Nữ ({femaleMembers.filter((m) => data.attendeeIds?.includes(m.id)).length}/{femaleMembers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {femaleMembers.map((m) => {
                          const isSelected = data.attendeeIds?.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleAttendee(m.id)}
                              className={`py-1 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? "bg-[var(--female)] text-white shadow-xs"
                                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--female)]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              <span>{m.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Guest Attendees Section (Single-day guests / non-stable person) */}
            <div className="mb-4 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  Khách ngoài hôm nay (chỉ tính buổi này):
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {(data.guests || []).length} khách
                </span>
              </div>

              {/* Add guest form */}
              <form onSubmit={handleAddGuest} className="flex items-center gap-2">
                <input
                  type="text"
                  value={guestName}
                  placeholder="Tên khách (VD: Minh, Hương...)"
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 py-1.5 px-2.5 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />

                {/* Gender toggle */}
                <div className="flex rounded-[8px] border border-[var(--border)] p-0.5 bg-[var(--card)]">
                  <button
                    type="button"
                    onClick={() => setGuestGender("male")}
                    className={`py-1 px-2 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                      guestGender === "male"
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestGender("female")}
                    className={`py-1 px-2 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                      guestGender === "female"
                        ? "bg-[var(--female)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    Nữ
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!guestName.trim()}
                  className="py-1.5 px-3 text-xs font-semibold rounded-[8px] bg-[var(--accent2)] hover:opacity-90 active:scale-95 text-white transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </form>

              {/* Guests pills list */}
              {(data.guests || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {maleGuests.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border border-blue-400/50 bg-blue-50/20 dark:bg-blue-950/40 text-[var(--accent)]"
                    >
                      <span>👨 {g.name} (Khách)</span>
                      <button
                        type="button"
                        onClick={() => removeGuestAttendee(g.id)}
                        className="p-0.5 rounded-full hover:bg-[var(--border)] text-[var(--muted)] hover:text-red-500 cursor-pointer transition-colors"
                        title="Xóa khách này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {femaleGuests.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border border-pink-400/50 bg-pink-50/20 dark:bg-pink-950/40 text-[var(--female)]"
                    >
                      <span>👩 {g.name} (Khách)</span>
                      <button
                        type="button"
                        onClick={() => removeGuestAttendee(g.id)}
                        className="p-0.5 rounded-full hover:bg-[var(--border)] text-[var(--muted)] hover:text-red-500 cursor-pointer transition-colors"
                        title="Xóa khách này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Manual steppers / Total count */}
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="nam"
                label="Tổng số Nam"
                hint={
                  maleGuests.length > 0 || selectedStableMembersCount > 0
                    ? `${selectedStableMembersCount} CĐ + ${maleGuests.length} Khách`
                    : undefined
                }
                value={data.nam}
                min={0}
                step={1}
                unit="bạn"
                onChange={(val) => updateField("nam", val)}
              />
              <NumberInput
                id="nu"
                label="Tổng số Nữ"
                hint={
                  femaleGuests.length > 0 || femaleMembers.some((m) => data.attendeeIds?.includes(m.id))
                    ? `${femaleMembers.filter((m) => data.attendeeIds?.includes(m.id)).length} CĐ + ${femaleGuests.length} Khách`
                    : undefined
                }
                value={data.nu}
                min={0}
                step={1}
                unit="bạn"
                onChange={(val) => updateField("nu", val)}
              />
            </div>
          </section>

          {/* Card: Chi phí */}
          <section className="app-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
                Chi phí
              </h2>
              <span className="text-xs text-[var(--muted)]">
                Đơn vị: x1000 đồng
              </span>
            </div>

            <div className="space-y-3">
              <NumberInput
                id="tienSan"
                label="Tiền sân (x1000 đồng)"
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
                  label="Giá 1 quả (x1000 đồng)"
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
                label="Tiền nước (x1000 đồng)"
                hint="VD: 50k"
                value={data.tienNuoc}
                min={0}
                step={5}
                unit="k"
                onChange={(val) => updateField("tienNuoc", val)}
              />
            </div>

            {/* Collapsible: Advanced options (Female discount ratio & rounding) */}
            <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Tùy chỉnh: Tỉ lệ Nữ ({Math.round(data.femaleRatio * 100)}%) &amp; Làm tròn
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-3 animate-in fade-in duration-150">
                  {/* Female ratio options */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-[var(--text)] font-medium">
                        Mức đóng Nữ so với Nam
                      </span>
                      <span className="font-bold text-[var(--female)]">
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
                          className={`py-1.5 px-1 text-[11px] font-semibold rounded-[8px] transition-all cursor-pointer ${
                            data.femaleRatio === opt.val
                              ? "bg-[var(--accent)] text-white shadow-xs"
                              : "bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounding mode */}
                  <div>
                    <span className="block text-xs text-[var(--text)] font-medium mb-1.5">
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
                          className={`py-1.5 px-1 text-[11px] font-semibold rounded-[8px] transition-all cursor-pointer ${
                            data.roundMode === m.key
                              ? "bg-[var(--accent2)] text-white shadow-xs"
                              : "bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent2)]"
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

          {/* Card: Ghi chú */}
          <section className="app-card p-5 space-y-3">
            <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
              Ghi chú danh sách
            </h2>

            <div>
              <label
                htmlFor="noteNam"
                className="block text-[0.82rem] text-[var(--muted)] mb-1.5"
              >
                Note: Nam
              </label>
              <textarea
                id="noteNam"
                rows={2}
                value={data.noteNam}
                placeholder="Tên các bạn Nam tham gia..."
                onChange={(e) => updateField("noteNam", e.target.value)}
                className="w-full p-2.5 text-sm rounded-[10px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors resize-y min-h-[60px]"
              />
            </div>

            <div>
              <label
                htmlFor="noteNu"
                className="block text-[0.82rem] text-[var(--muted)] mb-1.5"
              >
                Note: Nữ
              </label>
              <textarea
                id="noteNu"
                rows={2}
                value={data.noteNu}
                placeholder="Tên các bạn Nữ tham gia..."
                onChange={(e) => updateField("noteNu", e.target.value)}
                className="w-full p-2.5 text-sm rounded-[10px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors resize-y min-h-[60px]"
              />
            </div>
          </section>
        </div>

        {/* Right Column: Kết quả (Sticky on Desktop) */}
        <div className="md:col-span-5 md:sticky md:top-6 space-y-4">
          <section className="app-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
                Kết quả ({displayDate})
              </h2>
              {calculations.mauSo === 0 && (
                <span className="text-xs text-amber-500 font-medium">
                  Chưa có người chơi
                </span>
              )}
            </div>

            {/* Results breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2.5 border-b border-[var(--border)]">
                <div>
                  <span className="text-[0.9rem] text-[var(--muted)]">
                    Mỗi Nam trả
                  </span>
                  <div className="text-[11px] text-[var(--muted)] opacity-75">
                    {calculations.namCount} người
                  </div>
                </div>
                <span className="font-bold text-[1.15rem] text-[var(--accent)]">
                  {calculations.finalNam.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-[var(--border)]">
                <div>
                  <span className="text-[0.9rem] text-[var(--muted)]">
                    Mỗi Nữ trả
                  </span>
                  <div className="text-[11px] text-[var(--muted)] opacity-75">
                    {calculations.nuCount} người ({Math.round(calculations.ratio * 100)}%)
                  </div>
                </div>
                <span className="font-bold text-[1.15rem] text-[var(--female)]">
                  {calculations.finalNu.toLocaleString("vi-VN")} đ
                </span>
              </div>

              {/* Total line */}
              <div className="mt-2.5 pt-3.5 border-t-2 border-dashed border-[var(--border)] flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm text-[var(--text)]">
                    Tổng chi phí
                  </span>
                  <div className="text-[11px] text-[var(--muted)]">
                    Sân + Cầu ({data.soQua} quả) + Nước
                  </div>
                </div>
                <span className="text-[1.35rem] font-extrabold text-[var(--accent2)]">
                  {calculations.tongChiPhi.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Actions: Copy & Share */}
            <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 active:scale-98 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
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
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[var(--accent)]" />
                <span>Chia sẻ</span>
              </button>
            </div>

            {/* Quick Actions: VietQR & Save to Supabase */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsVietQROpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Mã VietQR</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToHistory}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent2)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[var(--accent2)]" />
                <span>Lưu DB Supabase</span>
              </button>
            </div>
          </section>

          {/* Recent History Preview (Connected to Supabase Database) */}
          {history.length > 0 && (
            <section className="app-card p-4 hidden md:block">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Lịch sử gần đây (DB)
                </span>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Xem tất cả ({history.length})</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {history.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[var(--text)]">
                        {item.date}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {item.maleCount} Nam, {item.femaleCount} Nữ
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[var(--accent2)]">
                        {Math.round(item.totalCost).toLocaleString("vi-VN")} đ
                      </div>
                      <button
                        onClick={() => handleRestoreHistory(item)}
                        className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Nạp lại
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FC Rat Chuyen Team Showcase Card */}
          <section className="app-card p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>FC Rất Chuyên (2026)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTeamPhotoOpen(true)}
                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>Xem ảnh lớn</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div
              onClick={() => setIsTeamPhotoOpen(true)}
              className="group relative rounded-[12px] overflow-hidden border border-[var(--border)] cursor-pointer bg-black/40"
              title="Bấm để mở ảnh lớn giải đấu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/team-photo.jpg"
                alt="FC Rất Chuyên Team Photo"
                className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>2026 Badminton Tournament</span>
                </div>
                <div className="text-[10px] text-slate-300">
                  115 Quán Thánh, Hà Nội • Bấm để phóng to
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-10 text-center text-xs text-[var(--muted)] space-y-1">
        <p>Cầu Lông Rất Chuyên • Lưu trữ đám mây Supabase &amp; Tự động đồng bộ</p>
        <p className="text-[11px] opacity-80">
          Công thức: Tiền Nam = Tổng / (Nam + 0.75 * Nữ) • Tiền Nữ = 75% Nam
        </p>
      </footer>

      {/* VietQR Modal */}
      <VietQRModal
        isOpen={isVietQROpen}
        onClose={() => setIsVietQROpen(false)}
        bankConfig={effectiveBankConfig}
        onSaveBankConfig={handleSaveBankConfig}
        amountNam={calculations.finalNam}
        amountNu={calculations.finalNu}
        hostName={activeHostMember?.name}
        activeHostMember={activeHostMember}
        onUpdateMemberBank={updateMemberBank}
      />

      {/* Member Manager Modal */}
      <MemberManagerModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        onAddMember={addMember}
        onDeleteMember={deleteMember}
        onUpdateMemberBank={updateMemberBank}
        currentMonth={currentMonth}
        monthlyHostId={monthlyHostId}
        onSetMonthlyHost={handleMonthlyHostChange}
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

      {/* Team Photo Lightbox Modal */}
      <TeamPhotoModal
        isOpen={isTeamPhotoOpen}
        onClose={() => setIsTeamPhotoOpen(false)}
      />
    </div>
  );
}
