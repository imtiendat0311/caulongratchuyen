import { NextRequest, NextResponse } from "next/server";

export const preferredRegion = "sin1";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Mapping of bank codes, short names, and aliases to their 6-digit NAPAS BIN (acqId).
 */
const BANK_BINS: Record<string, string> = {
  // Common big banks
  VCB: "970436",
  VIETCOMBANK: "970436",
  MB: "970422",
  MBBANK: "970422",
  TCB: "970407",
  TECHCOMBANK: "970407",
  ACB: "970416",
  BIDV: "970418",
  ICB: "970415",
  CTG: "970415",
  VIETINBANK: "970415",
  VBA: "970405",
  AGRIBANK: "970405",
  VPB: "970432",
  VPBANK: "970432",
  TPB: "970423",
  TPBANK: "970423",
  STB: "970403",
  SACOMBANK: "970403",
  HDB: "970437",
  HDBANK: "970437",
  VIB: "970441",
  SHB: "970443",
  EIB: "970431",
  EXIMBANK: "970431",
  MSB: "970426",
  OCB: "970448",
  LPB: "970449",
  LPBANK: "970449",
  LIENVIETPOSTBANK: "970449",
  SEAB: "970440",
  SEABANK: "970440",
  SSB: "970440",
  SCB: "970429",
  VCCB: "970454",
  VIETCAPITALBANK: "970454",
  BVBank: "970454",
  BVB: "970438",
  BAOVIETBANK: "970438",
  BAB: "970409",
  BACABANK: "970409",
  ABB: "970425",
  ABBANK: "970425",
  NAB: "970428",
  NAMABANK: "970428",
  VAB: "970427",
  VIETABANK: "970427",
  PGB: "970430",
  PGBANK: "970430",
  VIETBANK: "970433",
  VBB: "970433",
  KLB: "970452",
  KIENLONGBANK: "970452",
  SGICB: "970400",
  SAIGONBANK: "970400",
  SGB: "970400",
  PVCB: "970412",
  PVCOMBANK: "970412",
  NCB: "970419",
  SHBVN: "970424",
  SHINHANBANK: "970424",
  COOPBANK: "970446",
  CAKE: "546034",
  UBANK: "546035",
  TIMO: "963388",
  VTLMONEY: "971005",
  VIETTELMONEY: "971005",
  VNPTMONEY: "971011",
  MOMO: "971025",
  ZALOPAY: "971101",
  WVN: "970457",
  WOORI: "970457",
  KBANK: "668888",
  HSBC: "458761",
  STANDARDCHARTERED: "970410",
  SCVN: "970410",
  PUBLICBANK: "970439",
  PBVN: "970439",
  INDOVINABANK: "970434",
  IVB: "970434",
  CBB: "970444",
  CBBANK: "970444",
  GPB: "970408",
  GPBANK: "970408",
  VRB: "970421",
};

function getBankBin(bank: string): string | null {
  if (!bank) return null;
  const clean = bank.trim().toUpperCase().replace(/[\s\-_]+/g, "");
  if (BANK_BINS[clean]) return BANK_BINS[clean];
  if (/^\d{6}$/.test(clean)) return clean;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bank = searchParams.get("bank");
  const account = searchParams.get("account");
  const name = searchParams.get("name") || "";
  const info = searchParams.get("info") || "";

  if (!bank || !account) {
    return new NextResponse("Missing bank or account", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const amountParam = searchParams.get("amount");
  const template = searchParams.get("template") || "qr_only";
  const cleanAccount = account.trim();

  // Strip amount whenever <= 0 or invalid (never send amount=0 to VietQR)
  let numericAmount: number | undefined = undefined;
  if (amountParam) {
    const parsed = Number(amountParam.trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      numericAmount = Math.round(parsed);
    }
  }

  // 1. Primary method: Call POST https://api.vietqr.io/v2/generate for true raster PNG/JPEG
  const bin = getBankBin(bank);
  if (bin) {
    try {
      const payload: Record<string, unknown> = {
        accountNo: cleanAccount,
        accountName: name.trim(),
        acqId: bin,
        addInfo: info.trim(),
        format: "text",
        template: template.trim() || "qr_only",
      };
      if (numericAmount !== undefined) {
        payload.amount = numericAmount;
      }

      const v2Res = await fetch("https://api.vietqr.io/v2/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (v2Res.ok) {
        const json = await v2Res.json();
        if (json.code === "00" && json.data?.qrDataURL) {
          const dataUrl: string = json.data.qrDataURL;
          const commaIdx = dataUrl.indexOf(",");
          if (commaIdx !== -1) {
            const meta = dataUrl.slice(0, commaIdx);
            const base64Data = dataUrl.slice(commaIdx + 1);
            const buffer = Buffer.from(base64Data, "base64");

            // Detect PNG vs JPEG
            let contentType = "image/png";
            if (buffer[0] === 0xff && buffer[1] === 0xd8) {
              contentType = "image/jpeg";
            } else if (meta.includes("image/jpeg") || meta.includes("image/jpg")) {
              contentType = "image/jpeg";
            }

            return new NextResponse(buffer, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }
      }
    } catch (v2Err) {
      console.warn("VietQR v2 generate error, falling back to img.vietqr.io:", v2Err);
    }
  }

  // 2. Fallback method: Fetch https://img.vietqr.io/image/... with realistic browser headers
  const params = new URLSearchParams();
  if (name && name.trim()) params.set("accountName", name.trim());
  if (info && info.trim()) params.set("addInfo", info.trim());
  if (numericAmount !== undefined) params.set("amount", String(numericAmount));

  const queryString = params.toString();
  const remoteUrl = `https://img.vietqr.io/image/${bank}-${cleanAccount}-${template}.png${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://vietqr.io/",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch from VietQR", {
        status: res.status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const upstreamType = res.headers.get("content-type") || "";
    if (upstreamType.includes("svg") || upstreamType.includes("xml")) {
      let svgText = await res.text();

      // Inline any external nested sub-resource images so browsers do not block them inside <img>
      const hrefRegex = /(href|xlink:href)=["'](https?:\/\/[^"']+)["']/g;
      const matches = Array.from(svgText.matchAll(hrefRegex));
      for (const match of matches) {
        const fullMatch = match[0];
        const attr = match[1];
        const externalUrl = match[2];
        try {
          const subRes = await fetch(externalUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              Referer: "https://vietqr.io/",
            },
            cache: "no-store",
          });
          if (subRes.ok) {
            const subBuf = await subRes.arrayBuffer();
            const subBase64 = Buffer.from(subBuf).toString("base64");
            const subMime = subRes.headers.get("content-type") || "image/png";
            const dataUri = `data:${subMime};base64,${subBase64}`;
            svgText = svgText.replace(fullMatch, `${attr}="${dataUri}"`);
          }
        } catch (subErr) {
          console.warn("Failed to inline external sub-resource in SVG:", externalUrl, subErr);
        }
      }

      return new NextResponse(svgText, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": upstreamType || "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("VietQR proxy fetch error:", error);
    return new NextResponse("Internal server error fetching QR", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
