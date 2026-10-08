import { BadmintonData, BankConfig, HistoryItem, Member } from "@/types";
import { supabase } from "./supabase";

export const STORAGE_KEY = "cau-long-rat-chuyen-data";
export const BANK_STORAGE_KEY = "cau-long-bank-data";
export const HISTORY_STORAGE_KEY = "cau-long-history-data";
export const MEMBERS_STORAGE_KEY = "cau-long-members-data";

export const getTodayDateString = () => {
  if (typeof window === "undefined") return "";
  return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
};

export const DEFAULT_DATA: BadmintonData = {
  matchDate: "",
  attendeeIds: [],
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
          attendeeIds: Array.isArray(parsed.attendeeIds) ? parsed.attendeeIds : [],
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
        };
      } else {
        badmintonState = { ...DEFAULT_DATA };
      }
    } catch {
      badmintonState = { ...DEFAULT_DATA };
    }
  }
  return badmintonState ?? DEFAULT_DATA;
}

let saveTimeout: NodeJS.Timeout | null = null;

export function setBadmintonState(
  next: BadmintonData | ((prev: BadmintonData) => BadmintonData),
  skipDb = false
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

  if (!skipDb) {
    setSyncStatus("syncing");
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveSessionToSupabase(updated, getBankSnapshot());
    }, 600);
  }
}

export function subscribeBadminton(listener: () => void) {
  badmintonListeners.add(listener);
  return () => {
    badmintonListeners.delete(listener);
  };
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

export function setBankState(next: BankConfig, skipDb = false) {
  bankState = next;
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  bankListeners.forEach((l) => l());

  if (!skipDb) {
    setSyncStatus("syncing");
    saveSessionToSupabase(getBadmintonSnapshot(), next);
  }
}

export function subscribeBank(listener: () => void) {
  bankListeners.add(listener);
  return () => {
    bankListeners.delete(listener);
  };
}

// --- Members Store ---
let membersState: Member[] | null = null;
const membersListeners = new Set<() => void>();

export function getMembersSnapshot(): Member[] {
  if (typeof window === "undefined") return [];
  if (!membersState) {
    try {
      const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (raw) {
        membersState = JSON.parse(raw);
      } else {
        membersState = [];
      }
    } catch {
      membersState = [];
    }
  }
  return membersState ?? [];
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

// --- Supabase Persistence Operations ---

async function saveSessionToSupabase(
  calcData: BadmintonData,
  bank: BankConfig
) {
  try {
    const { error } = await supabase.from("session_settings").upsert({
      id: "default",
      match_date: calcData.matchDate || getTodayDateString(),
      attendee_ids: calcData.attendeeIds || [],
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
      bank_id: bank.bankId || "MB",
      bank_account_no: bank.accountNo || "",
      bank_account_name: bank.accountName || "",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Supabase session save error:", error.message);
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  } catch (err) {
    console.warn("Supabase session network error:", err);
    setSyncStatus("error");
  }
}

// Member CRUD
export async function addMember(name: string, gender: "male" | "female") {
  const newMember: Member = {
    id: "mem-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    gender,
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

export async function deleteMember(id: string) {
  const current = getMembersSnapshot();
  const updated = current.filter((m) => m.id !== id);
  setMembersState(updated);

  // If member was selected as attendee, remove from attendee list
  const currentData = getBadmintonSnapshot();
  if (currentData.attendeeIds.includes(id)) {
    toggleAttendee(id);
  }

  setSyncStatus("syncing");
  try {
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

// Toggle attendance for a member
export function toggleAttendee(memberId: string) {
  const currentData = getBadmintonSnapshot();
  const members = getMembersSnapshot();

  const isAttending = currentData.attendeeIds.includes(memberId);
  const nextAttendees = isAttending
    ? currentData.attendeeIds.filter((id) => id !== memberId)
    : [...currentData.attendeeIds, memberId];

  // Filter attending members
  const attendingList = members.filter((m) => nextAttendees.includes(m.id));
  const maleList = attendingList.filter((m) => m.gender === "male");
  const femaleList = attendingList.filter((m) => m.gender === "female");

  setBadmintonState((prev) => ({
    ...prev,
    attendeeIds: nextAttendees,
    nam: maleList.length,
    nu: femaleList.length,
    noteNam: maleList.map((m) => m.name).join(", "),
    noteNu: femaleList.map((m) => m.name).join(", "),
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

// Initial Sync & Real-time Subscription
let syncInitialized = false;

export function initSupabaseSync() {
  if (syncInitialized || typeof window === "undefined") return;
  syncInitialized = true;

  setSyncStatus("syncing");

  // Fetch initial data from Supabase
  Promise.all([
    supabase
      .from("session_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
    supabase
      .from("match_history")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true }),
  ])
    .then(([sessionRes, historyRes, membersRes]) => {
      if (sessionRes.data) {
        const s = sessionRes.data;
        const loadedData: BadmintonData = {
          matchDate: s.match_date || getTodayDateString(),
          attendeeIds: Array.isArray(s.attendee_ids) ? s.attendee_ids : [],
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
        };
        setBadmintonState(loadedData, true);

        if (s.bank_id || s.bank_account_no) {
          const loadedBank: BankConfig = {
            bankId: s.bank_id || "MB",
            accountNo: s.bank_account_no || "",
            accountName: s.bank_account_name || "",
            enabled: Boolean(s.bank_account_no),
          };
          setBankState(loadedBank, true);
        }
      }

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
        }));
        setHistoryState(loadedHistory);
      }

      if (membersRes.data && Array.isArray(membersRes.data)) {
        setMembersState(membersRes.data);
      }

      setSyncStatus("synced");
    })
    .catch((err) => {
      console.warn("Failed to load initial data from Supabase:", err);
      setSyncStatus("error");
    });

  // Listen to realtime changes across browsers/tabs
  supabase
    .channel("public-db-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "session_settings" },
      (payload) => {
        if (payload.new && typeof payload.new === "object") {
          const s = payload.new as Record<string, unknown>;
          if (s.id === "default") {
            const nextData: BadmintonData = {
              matchDate: (s.match_date as string) || getTodayDateString(),
              attendeeIds: Array.isArray(s.attendee_ids)
                ? (s.attendee_ids as string[])
                : [],
              nam: Number(s.nam),
              nu: Number(s.nu),
              tienSan: Number(s.tien_san),
              soQua: Number(s.so_qua),
              giaQua: Number(s.gia_qua),
              tienNuoc: Number(s.tien_nuoc),
              noteNam: (s.note_nam as string) || "",
              noteNu: (s.note_nu as string) || "",
              femaleRatio: Number(s.female_ratio),
              roundMode:
                (s.round_mode as BadmintonData["roundMode"]) || "exact",
            };
            setBadmintonState(nextData, true);

            if (s.bank_id || s.bank_account_no) {
              const nextBank: BankConfig = {
                bankId: (s.bank_id as string) || "MB",
                accountNo: (s.bank_account_no as string) || "",
                accountName: (s.bank_account_name as string) || "",
                enabled: Boolean(s.bank_account_no),
              };
              setBankState(nextBank, true);
            }
          }
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "members" },
      () => {
        supabase
          .from("members")
          .select("*")
          .order("name", { ascending: true })
          .then((res) => {
            if (res.data) {
              setMembersState(res.data);
            }
          });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_history" },
      () => {
        supabase
          .from("match_history")
          .select("*")
          .order("created_at", { ascending: false })
          .then((res) => {
            if (res.data) {
              const loadedHistory: HistoryItem[] = res.data.map((row) => ({
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
              }));
              setHistoryState(loadedHistory);
            }
          });
      }
    )
    .subscribe();
}
