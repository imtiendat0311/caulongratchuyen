import {
  BadmintonData,
  BankConfig,
  HistoryItem,
  Member,
  GuestAttendee,
  MonthlyHost,
} from "@/types";
import { supabase } from "./supabase";
import { generateBillIdentifiers } from "./bill-utils";

export const STORAGE_KEY = "cau-long-rat-chuyen-data";
export const BANK_STORAGE_KEY = "cau-long-bank-data";
export const HISTORY_STORAGE_KEY = "cau-long-history-data";
export const MEMBERS_STORAGE_KEY = "cau-long-members-data";
export const MONTHLY_HOSTS_STORAGE_KEY = "cau-long-monthly-hosts-data";

export const getTodayDateString = () => {
  if (typeof window === "undefined") return "";
  return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
};

export const getCurrentMonthString = () => {
  if (typeof window === "undefined") return "";
  return new Date().toLocaleDateString("sv-SE").slice(0, 7); // YYYY-MM
};

export const DEFAULT_DATA: BadmintonData = {
  matchDate: "",
  hostMemberId: "",
  attendeeIds: [],
  guests: [],
  courtName: "Nhà Thi Đấu Quán Thánh",
  courtAddress: "115 Quán Thánh, Ba Đình, Hà Nội",
  courtNumber: "Sân 1, Sân 2",
  nam: 4,
  nu: 2,
  tienSan: 520,
  soQua: 4,
  giaQua: 28,
  tienNuoc: 50,
  noteNam: "",
  noteNu: "",
  femaleRatio: 0.75,
  roundMode: "exact",
  orderNumber: "",
  serialNumber: "",
};

export const DEFAULT_BANK: BankConfig = {
  bankId: "MB",
  accountNo: "",
  accountName: "",
  enabled: false,
};

// --- Badminton Store ---
let badmintonState: BadmintonData | null = null;
const badmintonListeners = new Set<() => void>();

export function getBadmintonSnapshot(): BadmintonData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  if (!badmintonState) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        badmintonState = {
          ...DEFAULT_DATA,
          matchDate: parsed.matchDate || getTodayDateString(),
          hostMemberId: parsed.hostMemberId || "",
          attendeeIds: Array.isArray(parsed.attendeeIds) ? parsed.attendeeIds : [],
          guests: Array.isArray(parsed.guests) ? parsed.guests : [],
          courtName: parsed.courtName || DEFAULT_DATA.courtName,
          courtAddress: parsed.courtAddress || DEFAULT_DATA.courtAddress,
          courtNumber: parsed.courtNumber || DEFAULT_DATA.courtNumber,
          nam: parsed.nam !== undefined ? Number(parsed.nam) : DEFAULT_DATA.nam,
          nu: parsed.nu !== undefined ? Number(parsed.nu) : DEFAULT_DATA.nu,
          tienSan:
            parsed.tienSan !== undefined
              ? Number(parsed.tienSan)
              : DEFAULT_DATA.tienSan,
          soQua:
            parsed.soQua !== undefined
              ? Number(parsed.soQua)
              : DEFAULT_DATA.soQua,
          giaQua:
            parsed.giaQua !== undefined
              ? Number(parsed.giaQua)
              : DEFAULT_DATA.giaQua,
          tienNuoc:
            parsed.tienNuoc !== undefined
              ? Number(parsed.tienNuoc)
              : DEFAULT_DATA.tienNuoc,
          noteNam: parsed.noteNam ?? DEFAULT_DATA.noteNam,
          noteNu: parsed.noteNu ?? DEFAULT_DATA.noteNu,
          femaleRatio: parsed.femaleRatio ?? DEFAULT_DATA.femaleRatio,
          roundMode: parsed.roundMode ?? DEFAULT_DATA.roundMode,
          orderNumber: parsed.orderNumber || "",
          serialNumber: parsed.serialNumber || "",
        };
      } else {
        badmintonState = { ...DEFAULT_DATA };
      }
    } catch {
      badmintonState = { ...DEFAULT_DATA };
    }

    if (badmintonState && (!badmintonState.orderNumber || !badmintonState.serialNumber)) {
      const ids = generateBillIdentifiers(badmintonState.matchDate);
      badmintonState = {
        ...badmintonState,
        orderNumber: badmintonState.orderNumber || ids.orderNumber,
        serialNumber: badmintonState.serialNumber || ids.serialNumber,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(badmintonState));
      } catch {
        // ignore
      }
    }
  }
  return badmintonState ?? DEFAULT_DATA;
}

export function setBadmintonState(
  next: BadmintonData | ((prev: BadmintonData) => BadmintonData)
) {
  const current = getBadmintonSnapshot();
  const updated = typeof next === "function" ? next(current) : next;
  badmintonState = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  badmintonListeners.forEach((l) => l());
}

export function subscribeBadminton(listener: () => void) {
  badmintonListeners.add(listener);
  return () => {
    badmintonListeners.delete(listener);
  };
}

// --- Monthly Hosts Store ---
let monthlyHostsState: Record<string, string> | null = null; // month (YYYY-MM) -> hostMemberId
const monthlyHostsListeners = new Set<() => void>();

export function getMonthlyHostsSnapshot(): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (!monthlyHostsState) {
    try {
      const raw = localStorage.getItem(MONTHLY_HOSTS_STORAGE_KEY);
      if (raw) {
        monthlyHostsState = JSON.parse(raw);
      } else {
        monthlyHostsState = {};
      }
    } catch {
      monthlyHostsState = {};
    }
  }
  return monthlyHostsState ?? {};
}

export function setMonthlyHostsState(next: Record<string, string>) {
  monthlyHostsState = next;
  try {
    localStorage.setItem(MONTHLY_HOSTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  monthlyHostsListeners.forEach((l) => l());
}

export function subscribeMonthlyHosts(listener: () => void) {
  monthlyHostsListeners.add(listener);
  return () => {
    monthlyHostsListeners.delete(listener);
  };
}

export async function setMonthlyHost(
  month: string,
  memberId: string
): Promise<{ success: boolean; message?: string }> {
  const current = getMonthlyHostsSnapshot();
  const updated = { ...current, [month]: memberId };
  setMonthlyHostsState(updated);

  setSyncStatus("syncing");
  try {
    const { error } = await supabase.from("monthly_hosts").upsert({
      month,
      host_member_id: memberId,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("Supabase monthly_hosts error:", error.message);
      setSyncStatus("error");
      return { success: false, message: error.message };
    } else {
      setSyncStatus("synced");
      return { success: true };
    }
  } catch (err: unknown) {
    console.warn("Supabase monthly_hosts network error:", err);
    setSyncStatus("error");
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false, message: msg };
  }
}

// Daily host override (or empty to follow monthly)
export function setDailyHost(memberId: string) {
  setBadmintonState((prev) => ({
    ...prev,
    hostMemberId: memberId,
  }));
}

// --- Bank Store ---
let bankState: BankConfig | null = null;
const bankListeners = new Set<() => void>();

export function getBankSnapshot(): BankConfig {
  if (typeof window === "undefined") return DEFAULT_BANK;
  if (!bankState) {
    try {
      const raw = localStorage.getItem(BANK_STORAGE_KEY);
      if (raw) {
        bankState = { ...DEFAULT_BANK, ...JSON.parse(raw) };
      } else {
        bankState = { ...DEFAULT_BANK };
      }
    } catch {
      bankState = { ...DEFAULT_BANK };
    }
  }
  return bankState ?? DEFAULT_BANK;
}

export function setBankState(next: BankConfig) {
  bankState = next;
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  bankListeners.forEach((l) => l());
}

export function subscribeBank(listener: () => void) {
  bankListeners.add(listener);
  return () => {
    bankListeners.delete(listener);
  };
}

// --- Members Store ---
export const DEFAULT_MEMBERS: Member[] = [
  // Nam (14)
  { id: "mem-bong", name: "Bông", gender: "male" },
  { id: "mem-dat", name: "Đạt", gender: "male" },
  { id: "mem-dat-99", name: "Đạt 99", gender: "male" },
  { id: "mem-hiep", name: "Hiệp", gender: "male" },
  { id: "mem-hieu", name: "Hiếu", gender: "male" },
  { id: "mem-hung", name: "Hùng", gender: "male" },
  { id: "mem-huy", name: "Huy", gender: "male" },
  { id: "mem-shin", name: "Shin", gender: "male" },
  { id: "mem-thien", name: "Thiện", gender: "male" },
  { id: "mem-tien", name: "Tiến", gender: "male" },
  { id: "mem-tran", name: "Trần", gender: "male" },
  { id: "mem-tu", name: "Tú", gender: "male" },
  { id: "mem-tuyen", name: "Tuyến", gender: "male" },
  { id: "mem-xuan-anh", name: "Xuân Anh", gender: "male" },
  // Nữ (5)
  { id: "mem-ha-linh", name: "Hà Linh", gender: "female" },
  { id: "mem-meo", name: "Meo", gender: "female" },
  { id: "mem-ngan-le", name: "Ngân Lê", gender: "female" },
  { id: "mem-nguyen", name: "Nguyên", gender: "female" },
  { id: "mem-thao-linh", name: "Thảo Linh", gender: "female" },
];

let membersState: Member[] | null = null;
const membersListeners = new Set<() => void>();

export function getMembersSnapshot(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS;
  if (!membersState) {
    try {
      const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (raw) {
        membersState = JSON.parse(raw);
      } else {
        membersState = DEFAULT_MEMBERS;
      }
    } catch {
      membersState = DEFAULT_MEMBERS;
    }
  }
  return membersState ?? DEFAULT_MEMBERS;
}

export function setMembersState(next: Member[]) {
  membersState = next;
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  membersListeners.forEach((l) => l());
}

export function subscribeMembers(listener: () => void) {
  membersListeners.add(listener);
  return () => {
    membersListeners.delete(listener);
  };
}

// --- History Store ---
let historyState: HistoryItem[] | null = null;
const historyListeners = new Set<() => void>();

export function getHistorySnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  if (!historyState) {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        historyState = JSON.parse(raw);
      } else {
        historyState = [];
      }
    } catch {
      historyState = [];
    }
  }
  return historyState ?? [];
}

export function setHistoryState(next: HistoryItem[]) {
  historyState = next;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  historyListeners.forEach((l) => l());
}

export function subscribeHistory(listener: () => void) {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

// --- Sync Status Store ---
export type SyncStatus = "idle" | "syncing" | "synced" | "error";
let syncStatusState: SyncStatus = "idle";
const syncStatusListeners = new Set<() => void>();

export function getSyncStatusSnapshot(): SyncStatus {
  return syncStatusState;
}

export function setSyncStatus(next: SyncStatus) {
  syncStatusState = next;
  syncStatusListeners.forEach((l) => l());
}

export function subscribeSyncStatus(listener: () => void) {
  syncStatusListeners.add(listener);
  return () => {
    syncStatusListeners.delete(listener);
  };
}

let lastSavedTimeState: string | null = null;
const lastSavedTimeListeners = new Set<() => void>();

export function getLastSavedTimeSnapshot(): string | null {
  return lastSavedTimeState;
}

export function setLastSavedTime(time: string | null) {
  lastSavedTimeState = time;
  lastSavedTimeListeners.forEach((l) => l());
}

export function subscribeLastSavedTime(listener: () => void) {
  lastSavedTimeListeners.add(listener);
  return () => {
    lastSavedTimeListeners.delete(listener);
  };
}

// Explicit Session Cloud Operations (Only saved or loaded when requested by user)

export async function saveSessionToCloud(): Promise<{ success: boolean; message?: string }> {
  const calcData = getBadmintonSnapshot();
  const bank = getBankSnapshot();
  setSyncStatus("syncing");
  try {
    const { error } = await supabase.from("session_settings").upsert({
      id: "default",
      match_date: calcData.matchDate || getTodayDateString(),
      host_member_id: calcData.hostMemberId || "",
      attendee_ids: calcData.attendeeIds || [],
      guests: calcData.guests || [],
      court_name: calcData.courtName || DEFAULT_DATA.courtName,
      court_address: calcData.courtAddress || DEFAULT_DATA.courtAddress,
      court_number: calcData.courtNumber || DEFAULT_DATA.courtNumber,
      nam: calcData.nam,
      nu: calcData.nu,
      tien_san: calcData.tienSan,
      so_qua: calcData.soQua,
      gia_qua: calcData.giaQua,
      tien_nuoc: calcData.tienNuoc,
      note_nam: calcData.noteNam || "",
      note_nu: calcData.noteNu || "",
      female_ratio: calcData.femaleRatio,
      round_mode: calcData.roundMode,
      order_number: calcData.orderNumber || null,
      serial_number: calcData.serialNumber || null,
      bank_id: bank.bankId || "MB",
      bank_account_no: bank.accountNo || "",
      bank_account_name: bank.accountName || "",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Supabase session save error:", error.message);
      setSyncStatus("error");
      return { success: false, message: error.message };
    }
    setSyncStatus("synced");
    const nowTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastSavedTime(nowTime);
    return { success: true };
  } catch (err: unknown) {
    console.warn("Supabase session network error:", err);
    setSyncStatus("error");
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false, message: msg };
  }
}

export async function loadSessionFromCloud(): Promise<{ success: boolean; message?: string }> {
  setSyncStatus("syncing");
  try {
    const { data: s, error } = await supabase
      .from("session_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      setSyncStatus("error");
      return { success: false, message: error.message };
    }

    if (!s) {
      setSyncStatus("synced");
      return { success: false, message: "Chưa có buổi chơi nào được lưu trên Cloud" };
    }

    const loadedData: BadmintonData = {
      matchDate: s.match_date || getTodayDateString(),
      hostMemberId: s.host_member_id || "",
      attendeeIds: Array.isArray(s.attendee_ids) ? s.attendee_ids : [],
      guests: Array.isArray(s.guests) ? s.guests : [],
      courtName: s.court_name || DEFAULT_DATA.courtName,
      courtAddress: s.court_address || DEFAULT_DATA.courtAddress,
      courtNumber: s.court_number || DEFAULT_DATA.courtNumber,
      nam: Number(s.nam) ?? DEFAULT_DATA.nam,
      nu: Number(s.nu) ?? DEFAULT_DATA.nu,
      tienSan: Number(s.tien_san) ?? DEFAULT_DATA.tienSan,
      soQua: Number(s.so_qua) ?? DEFAULT_DATA.soQua,
      giaQua: Number(s.gia_qua) ?? DEFAULT_DATA.giaQua,
      tienNuoc: Number(s.tien_nuoc) ?? DEFAULT_DATA.tienNuoc,
      noteNam: s.note_nam ?? "",
      noteNu: s.note_nu ?? "",
      femaleRatio: Number(s.female_ratio) ?? DEFAULT_DATA.femaleRatio,
      roundMode: (s.round_mode as BadmintonData["roundMode"]) || "exact",
      orderNumber: s.order_number || undefined,
      serialNumber: s.serial_number || undefined,
    };
    setBadmintonState(loadedData);

    if (s.bank_id || s.bank_account_no) {
      const loadedBank: BankConfig = {
        bankId: s.bank_id || "MB",
        accountNo: s.bank_account_no || "",
        accountName: s.bank_account_name || "",
        enabled: Boolean(s.bank_account_no),
      };
      setBankState(loadedBank);
    }

    setSyncStatus("synced");
    return { success: true };
  } catch (err: unknown) {
    console.warn("Failed to load session from Supabase:", err);
    setSyncStatus("error");
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false, message: msg };
  }
}

// Member CRUD for Stable Members
export async function addMember(
  name: string,
  gender: "male" | "female",
  bank_id = "MB",
  account_no = "",
  account_name = ""
) {
  const newMember: Member = {
    id: "mem-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    gender,
    bank_id,
    account_no: account_no.trim(),
    account_name: account_name.trim().toUpperCase(),
    created_at: new Date().toISOString(),
  };

  const current = getMembersSnapshot();
  const updated = [...current, newMember];
  setMembersState(updated);

  setSyncStatus("syncing");
  try {
    const { error } = await supabase.from("members").insert({
      id: newMember.id,
      name: newMember.name,
      gender: newMember.gender,
      bank_id: newMember.bank_id,
      account_no: newMember.account_no,
      account_name: newMember.account_name,
      created_at: newMember.created_at,
    });

    if (error) {
      console.warn("Supabase member insert error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase member network error:", err);
    setSyncStatus("error");
  }
}

export async function updateMemberBank(
  id: string,
  bank_id: string,
  account_no: string,
  account_name: string
) {
  const current = getMembersSnapshot();
  const updated = current.map((m) =>
    m.id === id
      ? {
          ...m,
          bank_id,
          account_no: account_no.trim(),
          account_name: account_name.trim().toUpperCase(),
        }
      : m
  );
  setMembersState(updated);

  setSyncStatus("syncing");
  try {
    const { error } = await supabase
      .from("members")
      .update({
        bank_id,
        account_no: account_no.trim(),
        account_name: account_name.trim().toUpperCase(),
      })
      .eq("id", id);
    if (error) {
      console.warn("Supabase member bank update error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase member bank network error:", err);
    setSyncStatus("error");
  }
}

export async function deleteMember(id: string) {
  const current = getMembersSnapshot();
  const updated = current.filter((m) => m.id !== id);
  setMembersState(updated);

  const currentData = getBadmintonSnapshot();
  if (currentData.attendeeIds.includes(id)) {
    toggleAttendee(id);
  }
  if (currentData.hostMemberId === id) {
    setDailyHost("");
  }

  // Also clean up monthly hosts if this member was assigned
  const mHosts = getMonthlyHostsSnapshot();
  const nextMHosts: Record<string, string> = {};
  let hadMonthly = false;
  for (const [m, hostId] of Object.entries(mHosts)) {
    if (hostId === id) {
      hadMonthly = true;
    } else {
      nextMHosts[m] = hostId;
    }
  }
  if (hadMonthly) {
    setMonthlyHostsState(nextMHosts);
  }

  setSyncStatus("syncing");
  try {
    await supabase.from("monthly_hosts").delete().eq("host_member_id", id);
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      console.warn("Supabase member delete error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase member delete network error:", err);
    setSyncStatus("error");
  }
}

// Attendance Calculation Helper
function recalculateAttendees(attendeeIds: string[], guests: GuestAttendee[]) {
  const members = getMembersSnapshot();
  const attendingMembers = members.filter((m) => attendeeIds.includes(m.id));

  const maleMembers = attendingMembers.filter((m) => m.gender === "male");
  const femaleMembers = attendingMembers.filter((m) => m.gender === "female");

  const maleGuests = guests.filter((g) => g.gender === "male");
  const femaleGuests = guests.filter((g) => g.gender === "female");

  const totalNam = maleMembers.length + maleGuests.length;
  const totalNu = femaleMembers.length + femaleGuests.length;

  const noteNamParts = [
    ...maleMembers.map((m) => m.name),
    ...maleGuests.map((g) => `${g.name} (Khách)`),
  ];

  const noteNuParts = [
    ...femaleMembers.map((m) => m.name),
    ...femaleGuests.map((g) => `${g.name} (Khách)`),
  ];

  return {
    nam: totalNam,
    nu: totalNu,
    noteNam: noteNamParts.join(", "),
    noteNu: noteNuParts.join(", "),
  };
}

export function toggleAttendee(memberId: string) {
  const currentData = getBadmintonSnapshot();
  const isAttending = currentData.attendeeIds.includes(memberId);
  const nextAttendees = isAttending
    ? currentData.attendeeIds.filter((id) => id !== memberId)
    : [...currentData.attendeeIds, memberId];

  const { nam, nu, noteNam, noteNu } = recalculateAttendees(
    nextAttendees,
    currentData.guests || []
  );

  setBadmintonState((prev) => ({
    ...prev,
    attendeeIds: nextAttendees,
    nam,
    nu,
    noteNam,
    noteNu,
  }));
}

export function selectAllAttendees() {
  const members = getMembersSnapshot();
  const allIds = members.map((m) => m.id);
  const currentData = getBadmintonSnapshot();

  const { nam, nu, noteNam, noteNu } = recalculateAttendees(
    allIds,
    currentData.guests || []
  );

  setBadmintonState((prev) => ({
    ...prev,
    attendeeIds: allIds,
    nam,
    nu,
    noteNam,
    noteNu,
  }));
}

export function clearAllAttendees() {
  const currentData = getBadmintonSnapshot();
  const { nam, nu, noteNam, noteNu } = recalculateAttendees(
    [],
    currentData.guests || []
  );

  setBadmintonState((prev) => ({
    ...prev,
    attendeeIds: [],
    nam,
    nu,
    noteNam,
    noteNu,
  }));
}

export function addGuestAttendee(name: string, gender: "male" | "female") {
  const trimmed = name.trim();
  if (!trimmed) return;

  const newGuest: GuestAttendee = {
    id: "guest-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    name: trimmed,
    gender,
  };

  const currentData = getBadmintonSnapshot();
  const nextGuests = [...(currentData.guests || []), newGuest];

  const { nam, nu, noteNam, noteNu } = recalculateAttendees(
    currentData.attendeeIds || [],
    nextGuests
  );

  setBadmintonState((prev) => ({
    ...prev,
    guests: nextGuests,
    nam,
    nu,
    noteNam,
    noteNu,
  }));
}

export function removeGuestAttendee(guestId: string) {
  const currentData = getBadmintonSnapshot();
  const nextGuests = (currentData.guests || []).filter((g) => g.id !== guestId);

  const { nam, nu, noteNam, noteNu } = recalculateAttendees(
    currentData.attendeeIds || [],
    nextGuests
  );

  setBadmintonState((prev) => ({
    ...prev,
    guests: nextGuests,
    nam,
    nu,
    noteNam,
    noteNu,
  }));
}

export async function addHistoryItem(item: HistoryItem) {
  const current = getHistorySnapshot();
  const updated = [item, ...current];
  setHistoryState(updated);

  setSyncStatus("syncing");
  try {
    const { error } = await supabase.from("match_history").insert({
      id: item.id,
      date: item.date,
      total_cost: item.totalCost,
      cost_per_male: item.costPerMale,
      cost_per_female: item.costPerFemale,
      male_count: item.maleCount,
      female_count: item.femaleCount,
      court_cost: item.courtCost,
      shuttle_cost: item.shuttleCost,
      water_cost: item.waterCost,
      notes: item.notes || "",
      order_number: item.orderNumber || null,
      serial_number: item.serialNumber || null,
      host_name: item.hostName || null,
      host_member_id: item.hostMemberId || null,
      court_name: item.courtName || null,
      court_address: item.courtAddress || null,
    });

    if (error) {
      console.warn("Supabase history insert error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase history network error:", err);
    setSyncStatus("error");
  }
}

export async function deleteHistoryItem(id: string) {
  const current = getHistorySnapshot();
  const updated = current.filter((h) => h.id !== id);
  setHistoryState(updated);

  setSyncStatus("syncing");
  try {
    const { error } = await supabase
      .from("match_history")
      .delete()
      .eq("id", id);
    if (error) {
      console.warn("Supabase history delete error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase delete network error:", err);
    setSyncStatus("error");
  }
}

export async function clearAllHistory() {
  setHistoryState([]);
  setSyncStatus("syncing");
  try {
    const { error } = await supabase
      .from("match_history")
      .delete()
      .neq("id", "");
    if (error) {
      console.warn("Supabase history clear error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase clear network error:", err);
    setSyncStatus("error");
  }
}

// Initial Read-Only Hydration (No auto-sync, no background realtime channels)
let syncInitialized = false;

export function initSupabaseSync() {
  if (syncInitialized || typeof window === "undefined") return;
  syncInitialized = true;

  // Read-only initial load for history, members, and monthly hosts so local lists are populated
  Promise.all([
    supabase
      .from("match_history")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("monthly_hosts")
      .select("*"),
  ])
    .then(([historyRes, membersRes, monthlyHostsRes]) => {
      if (historyRes.data && Array.isArray(historyRes.data)) {
        const loadedHistory: HistoryItem[] = historyRes.data.map((row) => ({
          id: row.id,
          date: row.date,
          totalCost: Number(row.total_cost),
          costPerMale: Number(row.cost_per_male),
          costPerFemale: Number(row.cost_per_female),
          maleCount: Number(row.male_count),
          femaleCount: Number(row.female_count),
          courtCost: Number(row.court_cost),
          shuttleCost: Number(row.shuttle_cost),
          waterCost: Number(row.water_cost),
          notes: row.notes || "",
          orderNumber: row.order_number || undefined,
          serialNumber: row.serial_number || undefined,
          hostName: row.host_name || undefined,
          hostMemberId: row.host_member_id || undefined,
          courtName: row.court_name || undefined,
          courtAddress: row.court_address || undefined,
        }));
        setHistoryState(loadedHistory);
      }

      if (membersRes.data && Array.isArray(membersRes.data)) {
        setMembersState(membersRes.data);
      }

      if (monthlyHostsRes.data && Array.isArray(monthlyHostsRes.data)) {
        const hostsMap: Record<string, string> = {};
        (monthlyHostsRes.data as MonthlyHost[]).forEach((mh) => {
          hostsMap[mh.month] = mh.host_member_id;
        });
        setMonthlyHostsState(hostsMap);
      }
    })
    .catch((err) => {
      console.warn("Failed to load initial club directory from Supabase:", err);
    });
}

/**
 * Searches receipts from Cloud by Host Name and/or Order Number.
 * Enables the receipt retrieval system.
 */
export async function searchReceiptsFromCloud(query: {
  hostName?: string;
  orderNumber?: string;
  keyword?: string;
}): Promise<{ success: boolean; data: HistoryItem[]; message?: string }> {
  try {
    let builder = supabase.from("match_history").select("*");

    const kw = query.keyword?.trim();
    const ord = query.orderNumber?.trim();
    const host = query.hostName?.trim();

    if (ord) {
      builder = builder.ilike("order_number", `%${ord}%`);
    }
    if (host) {
      builder = builder.ilike("host_name", `%${host}%`);
    }
    if (kw && !ord && !host) {
      builder = builder.or(
        `order_number.ilike.%${kw}%,host_name.ilike.%${kw}%,date.ilike.%${kw}%,court_name.ilike.%${kw}%`
      );
    }

    const { data, error } = await builder
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return { success: false, data: [], message: error.message };
    }

    const items: HistoryItem[] = (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      totalCost: Number(row.total_cost),
      costPerMale: Number(row.cost_per_male),
      costPerFemale: Number(row.cost_per_female),
      maleCount: Number(row.male_count),
      femaleCount: Number(row.female_count),
      courtCost: Number(row.court_cost),
      shuttleCost: Number(row.shuttle_cost),
      waterCost: Number(row.water_cost),
      notes: row.notes || "",
      orderNumber: row.order_number || undefined,
      serialNumber: row.serial_number || undefined,
      hostName: row.host_name || undefined,
      hostMemberId: row.host_member_id || undefined,
      courtName: row.court_name || undefined,
      courtAddress: row.court_address || undefined,
    }));

    return { success: true, data: items };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error searching receipts";
    return { success: false, data: [], message: msg };
  }
}

