import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bank = searchParams.get("bank");
  const account = searchParams.get("account");
  const name = searchParams.get("name") || "";
  const info = searchParams.get("info");

  if (!bank || !account) {
    return new NextResponse("Missing bank or account", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const amount = searchParams.get("amount");
  const template = searchParams.get("template") || "qr_only";
  const cleanAccount = account.trim();

  const params = new URLSearchParams();
  if (name && name.trim()) {
    params.set("accountName", name.trim());
  }
  if (info && info.trim()) {
    params.set("addInfo", info.trim());
  }
  if (amount && amount.trim()) {
    params.set("amount", amount.trim());
  }

  const queryString = params.toString();
  // VietQR serves SVG with crisp vector QR matrix paths
  const remoteSvgUrl = `https://img.vietqr.io/image/${bank}-${cleanAccount}-${template}.svg${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const res = await fetch(remoteSvgUrl, {
      headers: {
        Accept: "image/svg+xml,image/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; VietQRProxy/1.0)",
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const svgText = await res.text();
      return new NextResponse(svgText, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fallback: try fetching .png endpoint if .svg fails (will follow redirect to SVG)
    const remotePngUrl = `https://img.vietqr.io/image/${bank}-${cleanAccount}-${template}.png${
      queryString ? `?${queryString}` : ""
    }`;
    const fallbackRes = await fetch(remotePngUrl, {
      headers: {
        Accept: "image/svg+xml,image/png,image/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; VietQRProxy/1.0)",
      },
      next: { revalidate: 86400 },
    });

    if (!fallbackRes.ok) {
      return new NextResponse("Failed to fetch from VietQR", {
        status: fallbackRes.status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const contentType = fallbackRes.headers.get("content-type") || "image/svg+xml; charset=utf-8";
    const body = await fallbackRes.text();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
