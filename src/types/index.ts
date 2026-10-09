export interface Member {
  id: string;
  name: string;
  gender: "male" | "female";
  bank_id?: string;
  account_no?: string;
  account_name?: string;
  created_at?: string;
}

export interface GuestAttendee {
  id: string;
  name: string;
  gender: "male" | "female";
}

export interface MonthlyHost {
  month: string; // YYYY-MM
  host_member_id: string;
}

export interface BadmintonCourt {
  id: string;
  name: string;
  address: string;
  courtNumber?: string;
  lat: number;
  lng: number;
}

export interface BadmintonData {
  matchDate: string; // YYYY-MM-DD
  hostMemberId: string; // daily host override (or empty to follow monthly host)
  attendeeIds: string[]; // IDs of stable members attending today
  guests: GuestAttendee[]; // non-stable guests joining ONLY for this date
  courtName: string;
  courtAddress: string;
  courtNumber: string;
  nam: number;
  nu: number;
  tienSan: number; // in thousands (k VND)
  soQua: number;
  giaQua: number; // in thousands (k VND)
  tienNuoc: number; // in thousands (k VND)
  noteNam: string;
  noteNu: string;
  femaleRatio: number; // default 0.75 (75%)
  roundMode: "exact" | "1k" | "5k";
}

export const PRESET_COURTS: BadmintonCourt[] = [
  {
    id: "quan-thanh",
    name: "Nhà Thi Đấu Quán Thánh",
    address: "115 Quán Thánh, Ba Đình, Hà Nội",
    courtNumber: "Sân 1, Sân 2",
    lat: 21.042588,
    lng: 105.837391,
  },
];

export interface BankConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  enabled: boolean;
}

export interface HistoryItem {
  id: string;
  date: string;
  totalCost: number;
  costPerMale: number;
  costPerFemale: number;
  maleCount: number;
  femaleCount: number;
  courtCost: number;
  shuttleCost: number;
  waterCost: number;
  notes: string;
}

export const POPULAR_BANKS = [
  { id: "MB", name: "MB Bank (Quân Đội)" },
  { id: "VCB", name: "Vietcombank" },
  { id: "TCB", name: "Techcombank" },
  { id: "VPB", name: "VPBank" },
  { id: "TPB", name: "TPBank" },
  { id: "ACB", name: "ACB" },
  { id: "BIDV", name: "BIDV" },
  { id: "ICB", name: "VietinBank" },
  { id: "STB", name: "Sacombank" },
  { id: "VIB", name: "VIB" },
  { id: "SHB", name: "SHB" },
];

