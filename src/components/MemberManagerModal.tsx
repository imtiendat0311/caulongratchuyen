"use client";

import React, { useState } from "react";
import { Users, X, Plus, Trash2, UserPlus, Sparkles } from "lucide-react";
import { Member } from "@/types";

interface MemberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddMember: (name: string, gender: "male" | "female") => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export function MemberManagerModal({
  isOpen,
  onClose,
  members,
  onAddMember,
  onDeleteMember,
}: MemberManagerModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMember(name.trim(), gender);
      setName("");
    } finally {
      setIsSubmitting(false);
    }
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

  const handleAddSample = async (sample: { name: string; gender: "male" | "female" }) => {
    await onAddMember(sample.name, sample.gender);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)] p-5 text-[var(--text)] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text)]">
              Danh Sách Thành Viên Cố Định
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Lưu danh sách nhóm để điểm danh nhanh mỗi buổi chơi
            </p>
          </div>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleSubmit} className="mb-4 p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              placeholder="Nhập tên thành viên..."
              onChange={(e) => setName(e.target.value)}
              className="flex-1 py-2 px-3 text-xs rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            {/* Gender Toggle */}
            <div className="flex rounded-[10px] border border-[var(--border)] p-0.5 bg-[var(--card)]">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
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
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-[var(--female)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Nữ
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 active:scale-98 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm thành viên vào nhóm</span>
          </button>
        </form>

        {/* Members List Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {members.length === 0 ? (
            <div className="text-center py-6 px-4 bg-[var(--bg)] rounded-[12px] border border-dashed border-[var(--border)]">
              <Users className="w-8 h-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium text-[var(--text)]">
                Chưa có thành viên nào trong danh sách cố định
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1 mb-3">
                Thêm tên các bạn thường xuyên tham gia để điểm danh 1 chạm.
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
                      <span>{s.name} ({s.gender === "male" ? "Nam" : "Nữ"})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Male Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                    Thành viên Nam ({maleMembers.length})
                  </span>
                </div>
                {maleMembers.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)] italic">
                    Chưa có bạn nam nào
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {maleMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] text-xs"
                      >
                        <span className="font-medium text-[var(--text)] truncate">
                          👨 {m.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMember(m.id)}
                          className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Female Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--female)] uppercase tracking-wider">
                    Thành viên Nữ ({femaleMembers.length})
                  </span>
                </div>
                {femaleMembers.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)] italic">
                    Chưa có bạn nữ nào
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {femaleMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] text-xs"
                      >
                        <span className="font-medium text-[var(--text)] truncate">
                          👩 {m.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMember(m.id)}
                          className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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
