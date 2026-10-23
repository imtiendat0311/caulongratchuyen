/**
 * VietQR image helpers.
 *
 * QR images are loaded through the same-origin `/api/vietqr` proxy so canvas
 * export never hits CORS. The proxy response for a given URL is cached by both
 * the browser and Vercel's edge CDN, so whenever the proxy's response shape or
 * cache semantics change, bump VIETQR_PROXY_VERSION: the version is part of the
 * query string, which gives every client a fresh cache key instead of serving a
 * stale body from an earlier build.
 */
export const VIETQR_PROXY_VERSION = "5";

export type VietQrImageOptions = {
  bankId?: string | null;
  accountNo?: string | null;
  accountName?: string | null;
  /** Transfer amount in VND. Omit or pass 0 for a plain transfer QR. */
  amount?: number | null;
  /** Transfer description (addInfo). */
  description?: string | null;
  /** VietQR template, e.g. "compact2" or "qr_only". */
  template?: string;
};

export type VietQrImageUrls = {
  proxy: string | null;
  direct: string | null;
};

export function buildVietQrImageUrls({
  bankId,
  accountNo,
  accountName,
  amount,
  description,
  template,
}: VietQrImageOptions): VietQrImageUrls {
  const bank = (bankId || "").trim();
  const account = (accountNo || "").trim();
  if (!bank || !account) return { proxy: null, direct: null };

  const name = (accountName || "").trim();
  const info = (description || "").trim();
  const qrTemplate = (template || "qr_only").trim() || "qr_only";
  const roundedAmount =
    typeof amount === "number" && Number.isFinite(amount) && amount > 0
      ? Math.round(amount)
      : null;

  const proxyParams = new URLSearchParams({
    bank,
    account,
    template: qrTemplate,
    v: VIETQR_PROXY_VERSION,
  });
  if (name) proxyParams.set("name", name);
  if (info) proxyParams.set("info", info);
  if (roundedAmount !== null) proxyParams.set("amount", String(roundedAmount));

  const proxyUrl = `/api/vietqr?${proxyParams.toString()}`;

  return {
    proxy: proxyUrl,
    direct: proxyUrl, // Always route through proxy to prevent browser CORS
  };
}

/** Absolute form of a possibly relative URL, for comparing against img.src. */
export function toAbsoluteUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}
