"use client";

import React, { useState } from "react";
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
} from "lucide-react";
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
  onSetMonthlyHost?: (month: string, memberId: string) => Promise<void>;
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
  onSetMonthlyHost,
}: MemberManagerModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankId, setBankId] = useState("MB");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing bank for a specific member
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editBankId, setEditBankId] = useState("MB");
  const [editAccountNo, setEditAccountNo] = useState("");
  const [editAccountName, setEditAccountName] = useState("");

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] p-4 sm:p-5 text-[var(--text)] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[var(--border)] shrink-0 bg-[var(--bg)] shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/team-photo.jpg"
              alt="FC Rất Chuyên"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text)]">
              Danh Sách Thành Viên Cố Định
            </h3>
            <p className="text-xs text-[var(--muted)]">
              FC Rất Chuyên • Quản lý thành viên cố định, STK &amp; chủ xị mỗi tháng
            </p>
          </div>
        </div>

        {/* Monthly Host Selector Bar */}
        {currentMonth && onSetMonthlyHost && members.length > 0 && (
          <div className="mb-3.5 p-2.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
              <Crown className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
              <span>Chủ xị mặc định Tháng {displayMonth}:</span>
            </div>
            <select
              value={monthlyHostId || ""}
              onChange={(e) => onSetMonthlyHost(currentMonth, e.target.value)}
              className="py-1 px-2.5 text-xs font-semibold rounded-[8px] border border-amber-500/40 bg-[var(--card)] text-[var(--text)] outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">-- Chưa chọn chủ xị --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.gender === "male" ? "Nam" : "Nữ"})
                  {m.account_no ? ` - ${m.bank_id}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add Member Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-3 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              placeholder="Nhập tên thành viên..."
              onChange={(e) => setName(e.target.value)}
              className="flex-1 py-1.5 px-3 text-xs rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            {/* Gender Toggle */}
            <div className="flex rounded-[10px] border border-[var(--border)] p-0.5 bg-[var(--card)]">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-1 px-2 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                  gender === "male"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Nam
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-1 px-2 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-[var(--female)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Nữ
              </button>
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
                  : "+ Thêm thông tin STK ngân hàng (để thu tiền khi làm chủ xị)"}
              </span>
            </button>

            {showBankForm && (
              <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-0.5">
                    Ngân hàng
                  </label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} - {b.name}
                      </option>
                    ))}
                  </select>
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

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 active:scale-98 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm thành viên vào danh sách</span>
          </button>
        </form>

        {/* Members List Container */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {members.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[var(--bg)] rounded-[12px] border border-dashed border-[var(--border)]">
              <Users className="w-8 h-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium text-[var(--text)]">
                Chưa có thành viên nào trong danh sách cố định
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1 mb-3">
                Thêm tên các bạn thường xuyên tham gia để điểm danh 1 chạm và chọn làm chủ xị.
              </p>

              {/* Quick suggestions */}
              <div className="pt-2 border-t border-[var(--border)] text-left">
                <span className="text-[11px] font-medium text-[var(--muted)] flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-[var(--accent2)]" />
                  Gợi ý thêm nhanh:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleMembers.map((s) => (
                    <button
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
                    </button>
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
                                  <span>Chủ xị T{displayMonth}</span>
                                </span>
                              )}

                              {m.account_no ? (
                                <button
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
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                                >
                                  + Thêm STK
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {currentMonth && onSetMonthlyHost && !isMonthlyHost && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetMonthlyHost(currentMonth, m.id)
                                  }
                                  className="text-[11px] py-0.5 px-1.5 rounded-[6px] text-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1 font-medium"
                                  title="Đặt làm chủ xị mặc định tháng"
                                >
                                  <Crown className="w-3 h-3" />
                                  <span className="hidden sm:inline">Làm chủ xị</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onDeleteMember(m.id)}
                                className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                                  <select
                                    value={editBankId}
                                    onChange={(e) =>
                                      setEditBankId(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                                  >
                                    {POPULAR_BANKS.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.id} - {b.name}
                                      </option>
                                    ))}
                                  </select>
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
                                <button
                                  type="button"
                                  onClick={() => setEditingMemberId(null)}
                                  className="py-1 px-2.5 text-[11px] rounded-[6px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditBank(m.id)}
                                  className="py-1 px-2.5 text-[11px] font-semibold rounded-[6px] bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lưu STK</span>
                                </button>
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
                                  <span>Chủ xị T{displayMonth}</span>
                                </span>
                              )}

                              {m.account_no ? (
                                <button
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
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditBank(m)}
                                  className="text-[10px] text-[var(--female)] hover:underline cursor-pointer"
                                >
                                  + Thêm STK
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {currentMonth && onSetMonthlyHost && !isMonthlyHost && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetMonthlyHost(currentMonth, m.id)
                                  }
                                  className="text-[11px] py-0.5 px-1.5 rounded-[6px] text-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1 font-medium"
                                  title="Đặt làm chủ xị mặc định tháng"
                                >
                                  <Crown className="w-3 h-3" />
                                  <span className="hidden sm:inline">Làm chủ xị</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onDeleteMember(m.id)}
                                className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                                  <select
                                    value={editBankId}
                                    onChange={(e) =>
                                      setEditBankId(e.target.value)
                                    }
                                    className="w-full py-1 px-2 text-xs rounded-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none"
                                  >
                                    {POPULAR_BANKS.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.id} - {b.name}
                                      </option>
                                    ))}
                                  </select>
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
                                <button
                                  type="button"
                                  onClick={() => setEditingMemberId(null)}
                                  className="py-1 px-2.5 text-[11px] rounded-[6px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditBank(m.id)}
                                  className="py-1 px-2.5 text-[11px] font-semibold rounded-[6px] bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lưu STK</span>
                                </button>
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
    </div>
  );
}
