import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bank = searchParams.get("bank");
  const account = searchParams.get("account");
  const name = searchParams.get("name") || "";
  const info = searchParams.get("info") || "Cau long FC Rat Chuyen";

  if (!bank || !account) {
    return new NextResponse("Missing bank or account", { status: 400 });
  }

  const amount = searchParams.get("amount");
  const template = searchParams.get("template") || "qr_only";
  const amountParam = amount ? `&amount=${encodeURIComponent(amount)}` : "";

  const cleanAccount = account.trim();
  const remoteUrl = `https://img.vietqr.io/image/${bank}-${cleanAccount}-${template}.png?addInfo=${encodeURIComponent(
    info
  )}&accountName=${encodeURIComponent(name.trim())}${amountParam}`;

  try {
    const res = await fetch(remoteUrl, {
      headers: {
        Accept: "image/png,image/*;q=0.8",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch from VietQR", { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("VietQR proxy fetch error:", error);
    return new NextResponse("Internal server error fetching QR", { status: 500 });
  }
}
