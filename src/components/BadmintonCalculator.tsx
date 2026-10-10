"use client";

import React, { useState, useMemo, useSyncExternalStore, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Check,
  RotateCcw,
  QrCode,
  History as HistoryIcon,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowUpRight,
  Calendar,
  UserCheck,
  UserPlus,
  Plus,
  X,
  User,
  Crown,
  CreditCard,
  Trophy,
  Calculator,
  Settings,
  Loader2,
  TrendingUp,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PixelCat, PixelRacket } from "./PixelArt";
import { ThemeToggle } from "./ThemeToggle";
import { NumberInput } from "./NumberInput";
import { VietQRModal } from "./VietQRModal";
import { HistoryDrawer } from "./HistoryDrawer";
import { MemberManagerModal } from "./MemberManagerModal";
import { TeamPhotoModal } from "./TeamPhotoModal";
import { SideRaysModal } from "./SideRaysModal";
import { TechText } from "./TechText";
import { HistoryGraphModal } from "./HistoryGraphModal";
import { CostcoReceipt } from "./CostcoReceipt";
import { CourtPickerAndMap, parseCourtsList } from "./CourtPickerAndMap";
import { SkeletonImage } from "./SkeletonImage";
import { HoverPreview, HoverPreviewTrigger } from "./HoverPreview";
import { getMemberAvatarUrl } from "@/lib/avatar";
import { BadmintonData, BankConfig, HistoryItem } from "@/types";
import { generateBillIdentifiers } from "@/lib/bill-utils";
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
  initSupabaseSync,
  saveSessionToCloud,
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

  const [copied, setCopied] = useState(false);
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTeamPhotoOpen, setIsTeamPhotoOpen] = useState(false);
  const [isSideRaysOpen, setIsSideRaysOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // New guest state for single-day attendance
  const [guestName, setGuestName] = useState("");
  const [guestGender, setGuestGender] = useState<"male" | "female">("male");
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Initialize Supabase sync on client mount
  useEffect(() => {
    initSupabaseSync();
    const snap = getBadmintonSnapshot();
    const today = getTodayDateString();
    const targetDate = snap.matchDate || today;
    if (!snap.orderNumber || !snap.serialNumber || !snap.matchDate) {
      const ids = generateBillIdentifiers(targetDate, snap.orderNumber);
      setBadmintonState((prev) => ({
        ...prev,
        matchDate: prev.matchDate || today,
        orderNumber: prev.orderNumber || ids.orderNumber,
        serialNumber: prev.serialNumber || ids.serialNumber,
      }));
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
    const res = await setMonthlyHost(month, newHostId);
    if (res.success) {
      showToast(`✓ Đã lưu Host Tháng ${month.split("-")[1]}/${month.split("-")[0]} lên Cloud!`);
    } else {
      showToast(`Lỗi lưu Host tháng: ${res.message || "Lỗi mạng"}`, "error");
    }
  };

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
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

  const courtsList = useMemo(
    () => parseCourtsList(data.courtNumber),
    [data.courtNumber]
  );
  const courtsCount = Math.max(1, courtsList.length);

  const updateField = <K extends keyof BadmintonData>(
    field: K,
    val: BadmintonData[K]
  ) => {
    setBadmintonState((prev) => ({ ...prev, [field]: val }));
  };

  const handleDateChange = (newDate: string) => {
    const newIds = generateBillIdentifiers(newDate, data.orderNumber);
    setBadmintonState((prev) => ({
      ...prev,
      matchDate: newDate,
      orderNumber: newIds.orderNumber,
      serialNumber: newIds.serialNumber,
    }));
  };

  const handleRegenerateBillId = () => {
    const newIds = generateBillIdentifiers(data.matchDate);
    setBadmintonState((prev) => ({
      ...prev,
      orderNumber: newIds.orderNumber,
      serialNumber: newIds.serialNumber,
    }));
    showToast(`✓ Đã tạo mã hóa đơn mới: #${newIds.orderNumber}`);
  };

  const handleReset = () => {
    if (window.confirm("Đặt lại toàn bộ về mặc định?")) {
      const today = getTodayDateString();
      const newIds = generateBillIdentifiers(today);
      setBadmintonState({
        ...DEFAULT_DATA,
        matchDate: today,
        orderNumber: newIds.orderNumber,
        serialNumber: newIds.serialNumber,
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

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (!trimmed || isAddingGuest) return;
    setIsAddingGuest(true);
    try {
      addGuestAttendee(trimmed, guestGender);
      setGuestName("");
      await new Promise((r) => setTimeout(r, 250));
    } finally {
      setIsAddingGuest(false);
    }
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

  const generateShareMessage = () => {
    let msg = `🏸 CẦU LÔNG RẤT CHUYÊN 🏸\n`;
    msg += `📅 Ngày: ${displayDate}\n`;
    if (data.courtName) {
      const courtsBadge =
        courtsList.length > 1
          ? ` (${courtsList.length} sân: ${data.courtNumber})`
          : data.courtNumber
          ? ` (${data.courtNumber})`
          : "";
      msg += `🏟️ Sân: ${data.courtName}${courtsBadge}\n`;
      if (data.courtAddress) {
        msg += `📍 Địa chỉ: ${data.courtAddress}\n`;
      }
    }
    if (activeHostMember) {
      msg += `👑 Host nhận tiền: ${activeHostMember.name}${
        isHostOverridden
          ? " (thay đổi riêng hôm nay)"
          : displayMonth
          ? ` (Host T${displayMonth})`
          : ""
      }\n`;
    }

    const attendingMaleNames = [
      ...maleMembers
        .filter((m) => data.attendeeIds?.includes(m.id))
        .map((m) => m.name),
      ...maleGuests.map((g) =>
        g.name.toLowerCase().includes("khách") ? g.name : `${g.name} (Khách)`
      ),
    ];

    const attendingFemaleNames = [
      ...femaleMembers
        .filter((m) => data.attendeeIds?.includes(m.id))
        .map((m) => m.name),
      ...femaleGuests.map((g) =>
        g.name.toLowerCase().includes("khách") ? g.name : `${g.name} (Khách)`
      ),
    ];

    const totalPlayersCount = calculations.namCount + calculations.nuCount;
    msg += `\n👥 Người chơi (${totalPlayersCount} bạn: ${calculations.namCount} Nam / ${calculations.nuCount} Nữ):\n`;

    const maleListStr =
      attendingMaleNames.length > 0
        ? attendingMaleNames.join(", ")
        : data.noteNam || "";
    msg += `• Nam (${calculations.namCount} bạn)${
      maleListStr ? `: ${maleListStr}` : ""
    }\n`;

    const femaleListStr =
      attendingFemaleNames.length > 0
        ? attendingFemaleNames.join(", ")
        : data.noteNu || "";
    msg += `• Nữ (${calculations.nuCount} bạn)${
      femaleListStr ? `: ${femaleListStr}` : ""
    }\n\n`;

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

    if (data.orderNumber) {
      msg += `\n🧾 Mã đơn: ${data.orderNumber}`;
    }

    if (effectiveBankConfig.accountNo) {
      msg += `\n💳 Chuyển khoản cho ${activeHostMember ? activeHostMember.name : "Host"}:\n• STK: ${effectiveBankConfig.accountNo} (${effectiveBankConfig.bankId})\n• Tên: ${effectiveBankConfig.accountName}\n• Nội dung: ${data.orderNumber || "Cau long"} [Tên bạn]`;
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

  const handleSaveToDB = async () => {
    const sessionRes = await saveSessionToCloud();
    const billIds = (!data.orderNumber || !data.serialNumber)
      ? generateBillIdentifiers(data.matchDate || displayDate)
      : { orderNumber: data.orderNumber, serialNumber: data.serialNumber };

    const hostName = activeHostMember ? activeHostMember.name : "FC Rất Chuyên";
    const hostMemberId = activeHostMember?.id || data.hostMemberId || "";

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
      orderNumber: billIds.orderNumber,
      serialNumber: billIds.serialNumber,
      hostName,
      hostMemberId,
      courtName: data.courtName,
      courtAddress: data.courtAddress,
    };

    await addHistoryItem(newItem);
    fireConfetti();
    if (sessionRes.success) {
      showToast(`✓ Đã lưu hóa đơn #${billIds.orderNumber} ngày ${displayDate} vào lịch sử!`);
    } else {
      showToast(`Lỗi lưu lịch sử: ${sessionRes.message || "Lỗi mạng"}`, "error");
    }
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
    let matchDate = "";
    if (item.date && item.date.includes("/")) {
      const parts = item.date.split("/");
      if (parts.length === 3) {
        matchDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    setBadmintonState((prev) => ({
      ...prev,
      matchDate: matchDate || prev.matchDate,
      nam: item.maleCount,
      nu: item.femaleCount,
      tienSan: Math.round(item.courtCost / 1000),
      soQua: 4,
      giaQua:
        item.shuttleCost > 0
          ? Math.round(item.shuttleCost / 4 / 1000)
          : prev.giaQua,
      tienNuoc: Math.round(item.waterCost / 1000),
      orderNumber: item.orderNumber || prev.orderNumber,
      serialNumber: item.serialNumber || prev.serialNumber,
      hostMemberId: item.hostMemberId || prev.hostMemberId,
      courtName: item.courtName || prev.courtName,
      courtAddress: item.courtAddress || prev.courtAddress,
    }));
    showToast(`✓ Đã nạp lại hóa đơn #${item.orderNumber || item.date}!`);
    setIsHistoryOpen(false);
  };


  return (
    <div className="w-full max-w-full md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-10 overflow-x-hidden min-w-0">
      {/* Header with Mascots, Title, and Action Toolbar */}
      <header className="mb-6 md:mb-8 text-center">
        {/* Team Avatar Badge */}
        <div className="flex flex-col items-center justify-center mb-2.5">
          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            onClick={() => setIsTeamPhotoOpen(true)}
            className="group relative cursor-pointer focus:outline-none"
            title="Bấm để xem ảnh kỷ niệm FC Rất Chuyên"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] rounded-full blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[var(--border)] shadow-md bg-[var(--card)]">
              <SkeletonImage
                src="/team-photo.jpg"
                alt="FC Rất Chuyên Team Avatar"
                wrapperClassName="w-full h-full rounded-full"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              />
            </div>
            <span className="absolute bottom-0 right-0 p-1 bg-[var(--card)] rounded-full border border-[var(--border)] shadow-xs text-[11px] group-hover:scale-110 transition-transform">
              🏸
            </span>
          </motion.button>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5 w-full">
          <div className="hover:scale-110 transition-transform shrink-0">
            <PixelCat className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div className="h-12 sm:h-14 md:h-16 w-[260px] sm:w-[340px] md:w-[420px] max-w-[calc(100vw-110px)] relative flex items-center justify-center">
            <h1 className="sr-only">Cầu Lông Rất Chuyên</h1>
            <TechText
              text="Cầu Lông Rất Chuyên"
              fontWeight={800}
              fontSize={44}
              gradientColors={["var(--accent)", "var(--accent2)"]}
              color="var(--text)"
              dashColor="var(--text)"
              accentColor="var(--accent)"
              reach={110}
              softness={0.7}
              dashLength={4}
              dashGap={2}
              strokeWidth={1.5}
              lineStyle="dashed"
              reveal="letter"
              specks={8}
              selection={true}
              labels={true}
              draggable={true}
              sweep={true}
              speed={1}
            />
          </div>
          <div className="hover:scale-110 transition-transform shrink-0">
            <PixelRacket className="w-6 h-9 sm:w-7 sm:h-10" />
          </div>
        </div>

        <div className="text-xs sm:text-sm text-[var(--muted)] mb-3.5">
          <span>Tính tiền chia sau mỗi buổi chơi</span>
        </div>

        {/* Compact action toolbar */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] flex-wrap justify-center">
          {/* Members manager button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
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
          </motion.button>

          {/* History button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
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
          </motion.button>

          {/* Graph button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setIsGraphModalOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Xem biểu đồ lịch sử chi phí & số người chơi (React Bits)"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Biểu đồ</span>
          </motion.button>

          {/* Ticket button (React Bits Tear Ticket) */}
          <Link
            href="/ticket"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] hover:text-amber-500 transition-colors cursor-pointer"
            title="Mở vé vào sân thi đấu (Tear Ticket - React Bits)"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-500" />
            <span>Vé vào sân</span>
          </Link>

          {/* QR button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setIsVietQROpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Tạo mã VietQR nhận tiền"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Mã QR</span>
          </motion.button>

          {/* Reset button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Đặt lại về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </motion.button>

          <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />

          <ThemeToggle />
        </div>
      </header>

      {/* Session & Host Information Card */}
      <div className="app-card p-3.5 mb-4 space-y-3">
        {/* Top row: Date Picker & Cloud Action Controls */}
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
              onChange={(e) => handleDateChange(e.target.value)}
              className="py-1 px-2.5 text-xs font-semibold rounded-[8px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => {
                const today = getTodayDateString();
                if (today) handleDateChange(today);
              }}
              className="text-xs py-1 px-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              Hôm nay
            </motion.button>
          </div>

          {/* Unique Order ID Badge with Refresh Button */}
          {data.orderNumber && (
            <div className="flex items-center gap-1.5 bg-[var(--bg)] px-2.5 py-1 rounded-xl border border-[var(--border)] shadow-2xs">
              <span className="text-[11px] text-[var(--muted)] font-medium">Mã đơn:</span>
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                #{data.orderNumber}
              </span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={handleRegenerateBillId}
                title="Tạo mã hóa đơn mới cho buổi này"
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Host for Today: Focused on TODAY's session only */}
        <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isHostOverridden
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                  : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
              }`}
            >
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                  Host buổi hôm nay ({displayDate})
                </span>
                {isHostOverridden ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white">
                    Đổi riêng hôm nay
                  </span>
                ) : monthlyHostMember ? (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]">
                    Mặc định Tháng {displayMonth}
                  </span>
                ) : null}
              </div>

              <div className="text-xs font-bold text-[var(--text)] truncate flex items-center gap-1.5 mt-0.5">
                {activeHostMember ? (
                  <>
                    <span className="text-[var(--accent2)]">
                      {activeHostMember.name}
                    </span>
                    {effectiveBankConfig.accountNo && (
                      <span className="text-[10.5px] text-[var(--muted)] font-normal hidden sm:inline">
                        ({effectiveBankConfig.bankId}: {effectiveBankConfig.accountNo})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--muted)] italic font-normal">
                    Chưa chọn Host
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick host changer for today */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative inline-flex items-center">
              <select
                value={data.hostMemberId || ""}
                onChange={(e) => handleDailyHostChange(e.target.value)}
                className="appearance-none h-8 pl-3 pr-8 text-xs font-semibold rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer max-w-[190px] truncate shadow-2xs"
                title="Đổi Host riêng cho buổi hôm nay nếu có sự cố"
              >
                <option value="">
                  {monthlyHostMember
                    ? `Mặc định (${monthlyHostMember.name})`
                    : "-- Chọn Host hôm nay --"}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === monthlyHostId ? "(Host tháng)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />
            </div>

            {isHostOverridden && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={() => handleDailyHostChange("")}
                className="h-8 w-8 flex items-center justify-center rounded-[8px] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-purple-400 hover:bg-[var(--card)] cursor-pointer transition-colors"
                title="Khôi phục về Host mặc định tháng"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className="h-8 flex items-center gap-1.5 px-2.5 rounded-[8px] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] cursor-pointer transition-colors"
              title="Cài đặt Host mặc định theo tháng & Thành viên"
            >
              <Settings className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] hidden sm:inline">Cài đặt tháng</span>
            </motion.button>
          </div>
        </div>

        {/* Bank quick banner for active host */}
        {activeHostMember && (
          <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-xs text-[var(--muted)] flex-wrap gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="shrink-0">STK nhận tiền ({activeHostMember.name}):</span>
              {effectiveBankConfig.accountNo ? (
                <span className="font-semibold text-[var(--text)] truncate">
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
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => setIsVietQROpen(true)}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <QrCode className="w-3 h-3" />
                <span>Mã QR &amp; Cài STK</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Grid: 1 column on Mobile, 2 columns on Laptop/Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start w-full min-w-0">
        {/* Left Column: Inputs (Người chơi, Chi phí, Ghi chú) */}
        <div className="w-full min-w-0 md:col-span-7 space-y-4">
          {/* Card: Sân Thi Đấu & Bản Đồ Địa Chỉ */}
          <CourtPickerAndMap
            courtName={data.courtName}
            courtAddress={data.courtAddress}
            courtNumber={data.courtNumber}
            onCourtChange={(name, address, courtNum) => {
              setBadmintonState((prev) => ({
                ...prev,
                courtName: name,
                courtAddress: address,
                courtNumber: courtNum || prev.courtNumber || "Sân 1, Sân 2",
              }));
            }}
            onApplyCourtCost={(cost) => updateField("tienSan", cost)}
          />

          {/* Card: Người chơi & Điểm danh thành viên & Khách ngày hôm nay */}
          <section className="app-card p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
              <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
                Người chơi
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setIsMemberModalOpen(true)}
                  className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>DS thành viên ({members.length})</span>
                </motion.button>
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
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={selectAllAttendees}
                    className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Chọn hết
                  </motion.button>
                  <span className="text-[10px] text-[var(--muted)]">|</span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={clearAllAttendees}
                    className="text-[11px] text-[var(--muted)] hover:text-red-500 cursor-pointer"
                  >
                    Bỏ chọn
                  </motion.button>
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
                <HoverPreview
                  imagePosition="above"
                  imageWidth={160}
                  imageHeight={185}
                  maxRotation={12}
                  maxOffset={14}
                  enterSpeed={0.2}
                  exitSpeed={0.15}
                  imageBorderRadius="1rem"
                >
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
                            <HoverPreviewTrigger
                              key={m.id}
                              target={{
                                id: m.id,
                                text: m.name,
                                imageUrl: getMemberAvatarUrl(m),
                                subtitle: "Nam • FC Rất Chuyên",
                                badge: m.id === monthlyHostId ? `👑 Host T${displayMonth}` : undefined,
                                bankInfo: m.account_no ? `${m.bank_id || "MB"} • ${m.account_no}` : undefined,
                              }}
                            >
                              <motion.button
                                whileTap={{ scale: 0.92 }}
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
                              </motion.button>
                            </HoverPreviewTrigger>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Female attendees */}
                  {femaleMembers.length > 0 && (
                    <div className="pt-1.5 border-t border-[var(--border)] mt-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--female)] mb-1.5">
                        Nữ ({femaleMembers.filter((m) => data.attendeeIds?.includes(m.id)).length}/{femaleMembers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {femaleMembers.map((m) => {
                          const isSelected = data.attendeeIds?.includes(m.id);
                          return (
                            <HoverPreviewTrigger
                              key={m.id}
                              target={{
                                id: m.id,
                                text: m.name,
                                imageUrl: getMemberAvatarUrl(m),
                                subtitle: "Nữ • FC Rất Chuyên",
                                badge: m.id === monthlyHostId ? `👑 Host T${displayMonth}` : undefined,
                                bankInfo: m.account_no ? `${m.bank_id || "MB"} • ${m.account_no}` : undefined,
                              }}
                            >
                              <motion.button
                                whileTap={{ scale: 0.92 }}
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
                              </motion.button>
                            </HoverPreviewTrigger>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </HoverPreview>
              )}
            </div>

            {/* Guest Attendees Section (Single-day guests / non-stable person) */}
            <div className="mb-4 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5">
              <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Khách ngoài hôm nay (chỉ tính buổi này):</span>
                </span>
                <span className="text-[11px] text-[var(--muted)] shrink-0">
                  {(data.guests || []).length} khách
                </span>
              </div>

              {/* Add guest form */}
              <form onSubmit={handleAddGuest} className="w-full min-w-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={guestName}
                  placeholder="Tên khách (VD: Minh, Hương...)"
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full min-w-0 flex-1 py-2 sm:py-1.5 px-3 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />

                <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto">
                  {/* Gender toggle */}
                  <div className="inline-flex rounded-[8px] border border-[var(--border)] p-0.5 bg-[var(--card)] shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setGuestGender("male")}
                      className={`py-1 px-3 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                        guestGender === "male"
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      Nam
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setGuestGender("female")}
                      className={`py-1 px-3 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                        guestGender === "female"
                          ? "bg-[var(--female)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      Nữ
                    </motion.button>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="submit"
                    disabled={!guestName.trim() || isAddingGuest}
                    className="py-1.5 px-3 text-xs font-semibold rounded-[8px] bg-[var(--accent2)] hover:opacity-90 text-white transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 shadow-xs shrink-0 flex-1 sm:flex-initial"
                  >
                    {isAddingGuest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang thêm...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Guests pills list */}
              {(data.guests || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 overflow-hidden">
                  <AnimatePresence>
                    {maleGuests.map((g) => (
                      <motion.span
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.18 }}
                        key={g.id}
                        className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border border-blue-400/50 bg-blue-50/20 dark:bg-blue-950/40 text-[var(--accent)] max-w-full"
                      >
                        <span className="truncate max-w-[200px]">👨 {g.name} (Khách)</span>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() => removeGuestAttendee(g.id)}
                          className="p-0.5 rounded-full hover:bg-[var(--border)] text-[var(--muted)] hover:text-red-500 cursor-pointer transition-colors shrink-0"
                          title="Xóa khách này"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.span>
                    ))}

                    {femaleGuests.map((g) => (
                      <motion.span
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.18 }}
                        key={g.id}
                        className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border border-pink-400/50 bg-pink-50/20 dark:bg-pink-950/40 text-[var(--female)] max-w-full"
                      >
                        <span className="truncate max-w-[200px]">👩 {g.name} (Khách)</span>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() => removeGuestAttendee(g.id)}
                          className="p-0.5 rounded-full hover:bg-[var(--border)] text-[var(--muted)] hover:text-red-500 cursor-pointer transition-colors shrink-0"
                          title="Xóa khách này"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
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
          <section className="app-card p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[0.95rem] font-bold uppercase tracking-[.04em] text-[var(--muted)] m-0">
                Chi phí
              </h2>
              <span className="text-xs text-[var(--muted)]">
                Đơn vị: x1000 đồng
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <NumberInput
                  id="tienSan"
                  label="Tiền sân"
                  hint={`Thuê ${courtsCount} sân (${data.courtNumber || "Sân 1, Sân 2"})`}
                  value={data.tienSan}
                  min={0}
                  step={10}
                  unit="k"
                  onChange={(val) => updateField("tienSan", val)}
                />

                <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] text-xs gap-2">
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Calculator className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Gợi ý: <strong>{courtsCount} sân</strong> × 2h × 130k ={" "}
                      <strong className="text-[var(--text)]">
                        {courtsCount * 260}k
                      </strong>
                    </span>
                  </div>
                  {data.tienSan !== courtsCount * 260 ? (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => updateField("tienSan", courtsCount * 260)}
                      className="w-full sm:w-auto py-1 px-2.5 rounded-[6px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition-colors cursor-pointer text-center"
                    >
                      Áp dụng {courtsCount * 260}k
                    </motion.button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Đã khớp ({courtsCount * 260}k)
                    </span>
                  )}
                </div>
              </div>

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
                label="Tiền nước"
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

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-3">
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
                            <motion.button
                              whileTap={{ scale: 0.93 }}
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
                            </motion.button>
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
                            <motion.button
                              whileTap={{ scale: 0.93 }}
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
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Costco Receipt Results (Sticky on Desktop) */}
        <div className="w-full min-w-0 md:col-span-5 md:sticky md:top-6 space-y-4">
          <CostcoReceipt
            date={displayDate}
            courtName={data.courtName}
            courtAddress={data.courtAddress}
            courtNumber={data.courtNumber}
            hostMember={activeHostMember}
            bankConfig={effectiveBankConfig}
            namCount={calculations.namCount}
            nuCount={calculations.nuCount}
            courtCost={calculations.tongTienSan}
            shuttleCost={calculations.tongTienCau}
            soQua={data.soQua}
            waterCost={calculations.tongTienNuoc}
            totalCost={calculations.tongChiPhi}
            finalNam={calculations.finalNam}
            finalNu={calculations.finalNu}
            ratio={calculations.ratio}
            orderNumber={data.orderNumber}
            serialNumber={data.serialNumber}
            onCopy={handleCopy}
            copied={copied}
            onShare={handleShare}
            onOpenVietQR={() => setIsVietQROpen(true)}
            onSaveToHistory={handleSaveToDB}
          />

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
                      <div className="font-medium text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                        <span>{item.date}</span>
                        {item.orderNumber && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--accent)] font-semibold">
                            #{item.orderNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {item.maleCount} Nam, {item.femaleCount} Nữ
                        {item.hostName && ` • Host: ${item.hostName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[var(--accent2)]">
                        {Math.round(item.totalCost).toLocaleString("vi-VN")} đ
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleRestoreHistory(item)}
                        className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Nạp lại
                      </motion.button>
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
                <span>FC Rất Chuyên</span>
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
              title="Bấm để mở ảnh lớn"
            >
              <SkeletonImage
                src="/team-photo.jpg"
                alt="FC Rất Chuyên Team Photo"
                wrapperClassName="w-full h-44 sm:h-48"
                showIcon={true}
                className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none z-2">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>CLB Cầu Lông Rất Chuyên</span>
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
        <p>Cầu Lông Rất Chuyên</p>
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
        orderNumber={data.orderNumber}
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
        monthlyHosts={monthlyHosts}
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
        onOpenGraph={() => {
          setIsHistoryOpen(false);
          setIsGraphModalOpen(true);
        }}
      />

      {/* Historical Graph Modal (Graph) */}
      <HistoryGraphModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        history={history}
      />

      {/* Team Photo Lightbox Modal */}
      <TeamPhotoModal
        isOpen={isTeamPhotoOpen}
        onClose={() => setIsTeamPhotoOpen(false)}
      />

      {/* Side Rays Background Modal */}
      <SideRaysModal
        isOpen={isSideRaysOpen}
        onClose={() => setIsSideRaysOpen(false)}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-5 right-5 z-50 pointer-events-none"
          >
            <div
              className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
                toastMessage.type === "error"
                  ? "bg-red-500/95 text-white border-red-600 shadow-red-500/20"
                  : toastMessage.type === "info"
                  ? "bg-blue-600/95 text-white border-blue-700 shadow-blue-500/20"
                  : "bg-emerald-600/95 text-white border-emerald-700 shadow-emerald-500/20"
              }`}
            >
              <span>{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
