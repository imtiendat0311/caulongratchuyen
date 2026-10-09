/**
 * Utility functions for generating and formatting unique bill identifiers,
 * order numbers, UPC-A serial numbers, and dynamic barcode SVG data.
 */

const L_PATTERNS = [
  "0001101", // 0
  "0011001", // 1
  "0010011", // 2
  "0111101", // 3
  "0100011", // 4
  "0110001", // 5
  "0101111", // 6
  "0111011", // 7
  "0110111", // 8
  "0001011", // 9
];

const R_PATTERNS = L_PATTERNS.map((pattern) =>
  pattern
    .split("")
    .map((bit) => (bit === "0" ? "1" : "0"))
    .join("")
);

/**
 * Calculates standard modulo-10 UPC-A checksum for an 11-digit string.
 */
export function calculateUpcCheckDigit(digits11: string): string {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(digits11[i] || "0", 10) || 0;
    // UPC-A: odd index positions (1-indexed, so 0, 2, 4...) multiplied by 3
    sum += i % 2 === 0 ? d * 3 : d * 1;
  }
  const rem = sum % 10;
  return ((10 - rem) % 10).toString();
}

/**
 * Parses date string (DD/MM/YYYY or YYYY-MM-DD) into 6-digit YYMMDD string.
 */
export function parseDateToYYMMDD(dateStr?: string): string {
  const now = new Date();
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) {
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  }

  const trimmed = dateStr.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      const yy = parts[2].length === 4 ? parts[2].slice(-2) : parts[2].padStart(2, "0");
      return `${yy}${mm}${dd}`;
    }
  }

  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      const yy = parts[0].length === 4 ? parts[0].slice(-2) : parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      const dd = parts[2].padStart(2, "0");
      return `${yy}${mm}${dd}`;
    }
  }

  // Fallback to current year/month/date
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * Formats a 12-digit serial number as standard UPC-A display: X XXXXX XXXXX X
 * Example: "826100947293" -> "8 26100 94729 3"
 */
export function formatSerialNumber(serial12: string): string {
  const cleaned = (serial12 || "").replace(/[^0-9]/g, "").padEnd(12, "0").slice(0, 12);
  return `${cleaned[0]} ${cleaned.slice(1, 6)} ${cleaned.slice(6, 11)} ${cleaned[11]}`;
}

export interface BillIdentifiers {
  orderNumber: string; // e.g. "CL-261009-4729"
  serialNumber: string; // e.g. "826100947293"
  formattedSerial: string; // e.g. "8 26100 94729 3"
  code: string; // 4-digit unique code e.g. "4729"
}

/**
 * Generates globally unique order number and matching 12-digit UPC serial number
 * for a bill.
 */
export function generateBillIdentifiers(
  dateStr?: string,
  existingCodeOrOrder?: string
): BillIdentifiers {
  const yymmdd = parseDateToYYMMDD(dateStr);

  let code = "";
  if (existingCodeOrOrder) {
    // If passed full order number like "CL-261009-4729", extract last part
    const matches = existingCodeOrOrder.match(/([0-9]{4})$/);
    if (matches && matches[1]) {
      code = matches[1];
    } else {
      const numOnly = existingCodeOrOrder.replace(/[^0-9]/g, "");
      if (numOnly.length >= 4) {
        code = numOnly.slice(-4);
      }
    }
  }

  if (!code || code.length !== 4) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  }

  const orderNumber = `CL-${yymmdd}-${code}`;
  const digits11 = `8${yymmdd}${code}`;
  const checkDigit = calculateUpcCheckDigit(digits11);
  const serialNumber = `${digits11}${checkDigit}`;
  const formattedSerial = formatSerialNumber(serialNumber);

  return {
    orderNumber,
    serialNumber,
    formattedSerial,
    code,
  };
}

export interface BarcodeRect {
  x: number;
  width: number;
}

/**
 * Encodes a 12-digit string into UPC-A binary bits (95 modules) and returns
 * SVG rectangle coordinates centered inside a viewBox of 0 0 200 45.
 */
export function generateUpcBarcodeBars(serial12: string): BarcodeRect[] {
  const cleaned = (serial12 || "").replace(/[^0-9]/g, "").padEnd(12, "0").slice(0, 12);

  let bits = "101"; // Start guard pattern

  // Left 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(cleaned[i], 10);
    bits += L_PATTERNS[digit] || L_PATTERNS[0];
  }

  // Center guard pattern
  bits += "01010";

  // Right 6 digits
  for (let i = 6; i < 12; i++) {
    const digit = parseInt(cleaned[i], 10);
    bits += R_PATTERNS[digit] || R_PATTERNS[0];
  }

  // End guard pattern
  bits += "101";

  // Center 95 modules inside width 200:
  // 95 modules * 2 = 190. Margin = (200 - 190) / 2 = 5.
  const paddingX = 5;
  const modWidth = 2;
  const rects: BarcodeRect[] = [];

  let inBar = false;
  let startX = 0;

  for (let i = 0; i <= bits.length; i++) {
    const isOne = i < bits.length && bits[i] === "1";
    if (isOne && !inBar) {
      inBar = true;
      startX = paddingX + i * modWidth;
    } else if (!isOne && inBar) {
      inBar = false;
      const endX = paddingX + i * modWidth;
      rects.push({
        x: startX,
        width: endX - startX,
      });
    }
  }

  return rects;
}
