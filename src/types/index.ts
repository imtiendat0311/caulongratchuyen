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
    lat: 21.0427,
    lng: 105.8415,
  },
  {
    id: "cau-giay",
    name: "Sân Cầu Lông Cầu Giấy",
    address: "35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội",
    courtNumber: "Sân 1, Sân 2",
    lat: 21.0345,
    lng: 105.7932,
  },
  {
    id: "hoc-vien-ktqs",
    name: "Sân Cầu Lông HV Kỹ Thuật Quân Sự",
    address: "236 Hoàng Quốc Việt, Cổ Nhuế, Bắc Từ Liêm, Hà Nội",
    courtNumber: "Sân 1, Sân 2",
    lat: 21.0475,
    lng: 105.7836,
  },
  {
    id: "dh-y-ha-noi",
    name: "Sân Cầu Lông Đại Học Y Hà Nội",
    address: "1 Tôn Thất Tùng, Kim Liên, Đống Đa, Hà Nội",
    courtNumber: "Sân 3, Sân 4",
    lat: 21.0035,
    lng: 105.8315,
  },
  {
    id: "tay-ho",
    name: "Nhà Thi Đấu Tây Hồ",
    address: "101 Xuân La, Xuân La, Tây Hồ, Hà Nội",
    courtNumber: "Sân 1, Sân 2",
    lat: 21.0632,
    lng: 105.8035,
  },
  {
    id: "bo-cong-an",
    name: "Sân Cầu Lông Bộ Công An",
    address: "Số 7 Nguyễn Cảnh Dị, Định Công, Hoàng Mai, Hà Nội",
    courtNumber: "Sân 1, Sân 2",
    lat: 20.9856,
    lng: 105.8398,
  },
  {
    id: "bach-khoa",
    name: "Nhà Thi Đấu Bách Khoa",
    address: "40 Tạ Quang Bửu, Bách Khoa, Hai Bà Trưng, Hà Nội",
    courtNumber: "Sân 3, Sân 4",
    lat: 21.0042,
    lng: 105.8465,
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

