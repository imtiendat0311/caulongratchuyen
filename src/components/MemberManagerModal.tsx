"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  X,
  Plus,
  Trash2,
  UserPlus,
  Sparkles,
  CreditCard,
  Crown,
  Check,
  Edit2,
  Save,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Member, POPULAR_BANKS } from "@/types";

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddMember: (
    name: string,
    gender: "male" | "female",
    bank_id?: string,
    account_no?: string,
    account_name?: string
  ) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onUpdateMemberBank?: (
    id: string,
    bank_id: string,
    account_no: string,
    account_name: string
  ) => Promise<void>;
  currentMonth?: string;
  monthlyHostId?: string;
  monthlyHosts?: Record<string, string>;
  onSetMonthlyHost?: (
    month: string,
    memberId: string
  ) => Promise<{ success: boolean; message?: string } | void>;
}

export function MemberManagerModal({
  isOpen,
  onClose,
  members,
  onAddMember,
  onDeleteMember,
  onUpdateMemberBank,
  currentMonth,
  monthlyHostId,
  monthlyHosts,
  onSetMonthlyHost,
}: MemberManagerModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankId, setBankId] = useState("MB");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staged Monthly Host state - saves explicitly only on user click
  const [userSelectedMonth, setUserSelectedMonth] = useState<string | null>(null);
  const [userSelectedHostId, setUserSelectedHostId] = useState<string | null>(null);
  const [isSavingHost, setIsSavingHost] = useState(false);
  const [hostSaveSuccess, setHostSaveSuccess] = useState(false);

  const selectedMonth = userSelectedMonth ?? (currentMonth || "");
  const baseHostForSelectedMonth =
    (monthlyHosts && monthlyHosts[selectedMonth]) ||
    (selectedMonth === currentMonth ? (monthlyHostId || "") : "");
  const stagedHostId = userSelectedHostId ?? baseHostForSelectedMonth;

  const isHostDirty =
    (userSelectedHostId !== null && userSelectedHostId !== baseHostForSelectedMonth) ||
    (userSelectedMonth !== null && userSelectedMonth !== (currentMonth || ""));

  const handleSaveMonthlyHost = async () => {
    if (!onSetMonthlyHost || !selectedMonth) return;
    setIsSavingHost(true);
    try {
      await onSetMonthlyHost(selectedMonth, stagedHostId);
      setHostSaveSuccess(true);
      setUserSelectedHostId(null);
      setTimeout(() => setHostSaveSuccess(false), 2500);
    } finally {
      setIsSavingHost(false);
    }
  };

  // Generate month options around current month (previous year, current year, next year)
  const monthOptions = useMemo(() => {
    const today = new Date();
    const actualYear = today.getFullYear();
    const actualMonth = today.getMonth() + 1;
    const actualCurrentMonthStr = `${actualYear}-${String(actualMonth).padStart(2, "0")}`;

    const baseYear = selectedMonth
      ? parseInt(selectedMonth.split("-")[0], 10) || actualYear
      : actualYear;

    const startYear = Math.min(actualYear - 1, baseYear - 1);
    const endYear = Math.max(actualYear + 1, baseYear + 1);

    const options: Array<{ value: string; label: string }> = [];

    for (let y = startYear; y <= endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const val = `${y}-${String(m).padStart(2, "0")}`;
        const isCurrent = val === actualCurrentMonthStr;
        options.push({
          value: val,
          label: `Tháng ${String(m).padStart(2, "0")}/${y}${isCurrent ? " (Hiện tại)" : ""}`,
        });
      }
    }

    if (selectedMonth && !options.some((o) => o.value === selectedMonth)) {
      const parts = selectedMonth.split("-");
      if (parts.length === 2) {
        options.push({
          value: selectedMonth,
          label: `Tháng ${parts[1]}/${parts[0]}`,
        });
        options.sort((a, b) => a.value.localeCompare(b.value));
      }
    }

    return options;
  }, [selectedMonth]);

  // Editing bank for a specific member
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editBankId, setEditBankId] = useState("MB");
  const [editAccountNo, setEditAccountNo] = useState("");
  const [editAccountName, setEditAccountName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMember(
        name.trim(),
        gender,
        showBankForm ? bankId : "MB",
        showBankForm ? accountNo.trim() : "",
        showBankForm ? accountName.trim().toUpperCase() : ""
      );
      setName("");
      setAccountNo("");
      setAccountName("");
      setShowBankForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditBank = (m: Member) => {
    setEditingMemberId(m.id);
    setEditBankId(m.bank_id || "MB");
    setEditAccountNo(m.account_no || "");
    setEditAccountName(m.account_name || m.name.toUpperCase());
  };

  const handleSaveEditBank = async (memberId: string) => {
    if (onUpdateMemberBank) {
      await onUpdateMemberBank(
        memberId,
        editBankId,
        editAccountNo.trim(),
        editAccountName.trim().toUpperCase()
      );
    }
    setEditingMemberId(null);
  };

  const maleMembers = members.filter((m) => m.gender === "male");
  const femaleMembers = members.filter((m) => m.gender === "female");

  const sampleMembers = [
    { name: "Tuấn", gender: "male" as const },
    { name: "Hoàng", gender: "male" as const },
    { name: "Dũng", gender: "male" as const },
    { name: "Nam", gender: "male" as const },
    { name: "Mai", gender: "female" as const },
    { name: "Lan", gender: "female" as const },
  ];

  const handleAddSample = async (sample: {
    name: string;
    gender: "male" | "female";
  }) => {
    await onAddMember(sample.name, sample.gender);
  };

  // Format month MM/YYYY
  const displayMonth = currentMonth
    ? `${currentMonth.split("-")[1]}/${currentMonth.split("-")[0]}`
    : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-lg rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] text-[var(--text)] max-h-[90vh] max-h-[90dvh] flex flex-col overflow-hidden"
          >
            {/* Fixed Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-[var(--border)] shrink-0 bg-[var(--bg)] shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/team-photo.jpg"
                    alt="FC Rất Chuyên"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-[var(--text)] truncate">
                    Danh Sách Thành Viên Cố Định
                  </h3>
                  <p className="text-xs text-[var(--muted)] truncate">
                    FC Rất Chuyên • Quản lý thành viên cố định, STK &amp; Host
                  </p>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

        {/* Unified Scrollable Body (Smooth scrolling across the entire screen on mobile) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 pt-3.5 space-y-3.5 min-h-0 touch-pan-y">
          {/* Monthly Host Management Section */}
          {onSetMonthlyHost && members.length > 0 && (
            <div className="p-3 rounded-[12px] bg-amber-500/10 border border-amber-500/30 space-y-2 w-full max-w-full min-w-0 overflow-hidden box-border">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <Crown className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                  <span>Host mặc định theo tháng</span>
                </div>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                  (Chỉ lưu khi bấm &quot;Lưu Host&quot;)
                </span>
              </div>

              <p className="text-[11px] text-[var(--muted)] leading-relaxed m-0">
                Chọn Host đại diện thu tiền cho tháng này. Không tự động sync khi vừa chọn nhằm tránh xung đột khi nhiều người cùng mở app.
              </p>

              <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:items-end pt-1 w-full max-w-full min-w-0">
                <div className="w-full min-w-0 sm:col-span-4">
                  <label className="block text-[10.5px] text-[var(--muted)] mb-1 font-medium">
                    Tháng áp dụng
                  </label>
                  <div className="relative w-full min-w-0">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setUserSelectedMonth(e.target.value);
                        setUserSelectedHostId(null);
                      }}
                      className="w-full max-w-full min-w-0 h-9 appearance-none pl-3 pr-8 text-xs font-semibold rounded-[8px] border border-amber-500/40 bg-[var(--card)] text-[var(--text)] outline-none focus:border-amber-500 cursor-pointer shadow-2xs truncate box-border"
                    >
                      {monthOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500/80" />
                  </div>
                </div>

                <div className="w-full min-w-0 sm:col-span-5">
                  <label className="block text-[10.5px] text-[var(--muted)] mb-1 font-medium">
                    Thành viên Host
                  </label>
                  <div className="relative w-full min-w-0">
                    <select
                      value={stagedHostId}
                      onChange={(e) => setUserSelectedHostId(e.target.value)}
                      className="w-full max-w-full min-w-0 h-9 appearance-none pl-3 pr-8 text-xs font-semibold rounded-[8px] border border-amber-500/40 bg-[var(--card)] text-[var(--text)] outline-none focus:border-amber-500 cursor-pointer shadow-2xs truncate box-border"
                    >
                      <option value="">-- Chưa chỉ định (Để trống) --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.gender === "male" ? "Nam" : "Nữ"})
                          {m.account_no ? ` - ${m.bank_id}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500/80" />
                  </div>
                </div>

                <div className="w-full min-w-0 sm:col-span-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSaveMonthlyHost}
                    disabled={isSavingHost || !selectedMonth}
                    className={`w-full h-9 px-3 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      hostSaveSuccess
                        ? "bg-emerald-600 text-white"
                        : isHostDirty
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25"
                        : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                    }`}
                  >
                    {hostSaveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Lưu!</span>
                      </>
                    ) : isSavingHost ? (
                      <span>Đang lưu...</span>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu Host</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Add Member Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5"
          >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              placeholder="Nhập tên thành viên..."
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-0 py-1.5 px-3 text-xs rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            {/* Gender Toggle */}
            <div className="flex rounded-[10px] border border-[var(--border)] p-0.5 bg-[var(--card)]">
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => setGender("male")}
                className={`py-1 px-2 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                  gender === "male"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Nam
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => setGender("female")}
                className={`py-1 px-2 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-[var(--female)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Nữ
              </motion.button>
            </div>
          </div>

          {/* Toggle Bank Account Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowBankForm(!showBankForm)}
              className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <CreditCard className="w-3 h-3" />
              <span>
                {showBankForm
                  ? "Ẩn thông tin ngân hàng"
                  : "+ Thêm thông tin STK ngân hàng (để thu tiền khi làm Host)"}
              </span>
            </button>

            {showBankForm && (
              <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                    Ngân hàng
                  </label>
                  <div className="relative">
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full appearance-none py-1 pl-2.5 pr-7 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none cursor-pointer"
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
                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountNo}
                    placeholder="VD: 0988..."
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                    Tên chủ thẻ
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    placeholder="VD: NGUYEN VAN A"
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm thành viên vào danh sách</span>
          </motion.button>
        </form>

        {/* Members List Section */}
        <div className="space-y-3.5 pt-1">
          {members.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[var(--bg)] rounded-[12px] border border-dashed border-[var(--border)]">
              <Users className="w-8 h-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium text-[var(--text)]">
                Chưa có thành viên nào trong danh sách cố định
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1 mb-3">
                Thêm tên các bạn thường xuyên tham gia để điểm danh 1 chạm và chọn làm Host.
              </p>

              {/* Quick suggestions */}
              <div className="pt-2 border-t border-[var(--border)] text-left">
                <span className="text-[11px] font-medium text-[var(--muted)] flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-[var(--accent2)]" />
                  Gợi ý thêm nhanh:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleMembers.map((s) => (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      key={s.name}
                      type="button"
                      onClick={() => handleAddSample(s)}
                      className={`text-[11px] py-1 px-2 rounded-full border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] flex items-center gap-1 transition-colors cursor-pointer ${
                        s.gender === "male"
                          ? "text-[var(--accent)]"
                          : "text-[var(--female)]"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {s.name} ({s.gender === "male" ? "Nam" : "Nữ"})
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Male Members Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                    Thành viên Nam ({maleMembers.length})
                  </span>
                </div>
                {maleMembers.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)] italic">
                    Chưa có bạn nam nào
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {maleMembers.map((m) => {
                      const isMonthlyHost = m.id === monthlyHostId;
                      const isEditingThis = editingMemberId === m.id;

                      return (
                        <div
                          key={m.id}
                          className={`p-2 rounded-[10px] bg-[var(--bg)] border transition-colors ${
                            isMonthlyHost
                              ? "border-amber-500/50 bg-amber-500/5"
                              : "border-[var(--border)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[var(--text)]">
                                👨 {m.name}
                              </span>

                              {isMonthlyHost && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                                  <Crown className="w-2.5 h-2.5 fill-current" />
                                  <span>Host T{displayMonth}</span>
                                </span>
                              )}

                              {m.account_no ? (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10px] bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] cursor-pointer"
                                  title="Bấm để chỉnh sửa STK"
                                >
                                  <CreditCard className="w-2.5 h-2.5 text-[var(--accent)]" />
                                  <span>
                                    {m.bank_id}: {m.account_no}
                                  </span>
                                  <Edit2 className="w-2.5 h-2.5 opacity-60" />
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                                >
                                  + Thêm STK
                                </motion.button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {onSetMonthlyHost && !isMonthlyHost && (
                                <motion.button
                                  whileTap={{ scale: 0.92 }}
                                  type="button"
                                  onClick={() => setUserSelectedHostId(m.id)}
                                  className="text-[11px] py-0.5 px-1.5 rounded-[6px] text-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1 font-medium"
                                  title="Chọn làm Host mặc định tháng"
                                >
                                  <Crown className="w-3 h-3" />
                                  <span className="hidden sm:inline">Làm Host</span>
                                </motion.button>
                              )}

                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                type="button"
                                onClick={() => onDeleteMember(m.id)}
                                className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Inline Bank Editor */}
                          {isEditingThis && (
                            <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Ngân hàng
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={editBankId}
                                      onChange={(e) =>
                                        setEditBankId(e.target.value)
                                      }
                                      className="w-full appearance-none py-1 pl-2.5 pr-7 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none cursor-pointer"
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
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Số tài khoản
                                  </label>
                                  <input
                                    type="text"
                                    value={editAccountNo}
                                    placeholder="Số tài khoản..."
                                    onChange={(e) =>
                                      setEditAccountNo(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Tên chủ thẻ
                                  </label>
                                  <input
                                    type="text"
                                    value={editAccountName}
                                    placeholder="Tên không dấu..."
                                    onChange={(e) =>
                                      setEditAccountName(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none uppercase"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-1.5">
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => setEditingMemberId(null)}
                                  className="py-1 px-2.5 text-[11px] rounded-[6px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                                >
                                  Hủy
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleSaveEditBank(m.id)}
                                  className="py-1 px-2.5 text-[11px] font-semibold rounded-[6px] bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lưu STK</span>
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Female Members Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--female)] uppercase tracking-wider">
                    Thành viên Nữ ({femaleMembers.length})
                  </span>
                </div>
                {femaleMembers.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)] italic">
                    Chưa có bạn nữ nào
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {femaleMembers.map((m) => {
                      const isMonthlyHost = m.id === monthlyHostId;
                      const isEditingThis = editingMemberId === m.id;

                      return (
                        <div
                          key={m.id}
                          className={`p-2 rounded-[10px] bg-[var(--bg)] border transition-colors ${
                            isMonthlyHost
                              ? "border-amber-500/50 bg-amber-500/5"
                              : "border-[var(--border)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[var(--text)]">
                                👩 {m.name}
                              </span>

                              {isMonthlyHost && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                                  <Crown className="w-2.5 h-2.5 fill-current" />
                                  <span>Host T{displayMonth}</span>
                                </span>
                              )}

                              {m.account_no ? (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10px] bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--female)] cursor-pointer"
                                  title="Bấm để chỉnh sửa STK"
                                >
                                  <CreditCard className="w-2.5 h-2.5 text-[var(--female)]" />
                                  <span>
                                    {m.bank_id}: {m.account_no}
                                  </span>
                                  <Edit2 className="w-2.5 h-2.5 opacity-60" />
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="text-[10px] text-[var(--female)] hover:underline cursor-pointer"
                                >
                                  + Thêm STK
                                </motion.button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {onSetMonthlyHost && !isMonthlyHost && (
                                <motion.button
                                  whileTap={{ scale: 0.92 }}
                                  type="button"
                                  onClick={() => setUserSelectedHostId(m.id)}
                                  className="text-[11px] py-0.5 px-1.5 rounded-[6px] text-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1 font-medium"
                                  title="Chọn làm Host mặc định tháng"
                                >
                                  <Crown className="w-3 h-3" />
                                  <span className="hidden sm:inline">Làm Host</span>
                                </motion.button>
                              )}

                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                type="button"
                                onClick={() => onDeleteMember(m.id)}
                                className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Inline Bank Editor */}
                          {isEditingThis && (
                            <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Ngân hàng
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={editBankId}
                                      onChange={(e) =>
                                        setEditBankId(e.target.value)
                                      }
                                      className="w-full appearance-none py-1 pl-2.5 pr-7 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none cursor-pointer"
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
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Số tài khoản
                                  </label>
                                  <input
                                    type="text"
                                    value={editAccountNo}
                                    placeholder="Số tài khoản..."
                                    onChange={(e) =>
                                      setEditAccountNo(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                                    Tên chủ thẻ
                                  </label>
                                  <input
                                    type="text"
                                    value={editAccountName}
                                    placeholder="Tên không dấu..."
                                    onChange={(e) =>
                                      setEditAccountName(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none uppercase"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-1.5">
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => setEditingMemberId(null)}
                                  className="py-1 px-2.5 text-[11px] rounded-[6px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                                >
                                  Hủy
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => handleSaveEditBank(m.id)}
                                  className="py-1 px-2.5 text-[11px] font-semibold rounded-[6px] bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lưu STK</span>
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </motion.div>
    )}
  </AnimatePresence>
);
}
