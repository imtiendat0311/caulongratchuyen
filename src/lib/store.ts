import { BadmintonData, BankConfig, HistoryItem } from "@/types";

export const STORAGE_KEY = "cau-long-rat-chuyen-data";
export const BANK_STORAGE_KEY = "cau-long-bank-data";
export const HISTORY_STORAGE_KEY = "cau-long-history-data";

export const DEFAULT_DATA: BadmintonData = {
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
