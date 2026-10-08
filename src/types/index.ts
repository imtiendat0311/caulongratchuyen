export interface Member {
  id: string;
  name: string;
  gender: "male" | "female";
  created_at?: string;
}

export interface GuestAttendee {
  id: string;
  name: string;
  gender: "male" | "female";
}

export interface BadmintonData {
  matchDate: string; // YYYY-MM-DD
  attendeeIds: string[]; // IDs of stable members attending today
  guests: GuestAttendee[]; // non-stable guests joining ONLY for this date
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
