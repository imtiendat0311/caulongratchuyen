"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  Navigation,
  CheckCircle2,
  Scissors,
  Share2,
  Smartphone,
  Monitor,
  Flame,
  Award,
} from "lucide-react";
import TearTicket, { TearTicketOrientation } from "./TearTicket";
import { PRESET_COURTS, BadmintonCourt } from "@/types";
import {
  subscribeBadminton,
  getBadmintonSnapshot,
  DEFAULT_DATA,
} from "@/lib/store";
import { generateUpcBarcodeBars } from "@/lib/bill-utils";
import SideRays from "./SideRays";

// Synthesize pleasant paper tear / snap click using Web Audio API
function playPaperTearSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 1. Rustling paper noise burst
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    noise.start();

    // 2. High-frequency crisp snap click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.02);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.09);

    oscGain.gain.setValueAtTime(0.35, ctx.currentTime + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.02);
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function TicketView() {
  // Sync with main app's court data or default
  const sessionData = useSyncExternalStore(
    subscribeBadminton,
    getBadmintonSnapshot,
    () => DEFAULT_DATA
  );

  const [orientation, setOrientation] = useState<TearTicketOrientation>("horizontal");
  const [isTorn, setIsTorn] = useState(false);
  const [tearKey, setTearKey] = useState(1);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("quan-thanh");
  const [copiedShare, setCopiedShare] = useState(false);

  // Auto-detect mobile screen for initial orientation
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setOrientation("vertical");
    }
  }, []);

  // Selected Court Info
  const activeCourt: BadmintonCourt = useMemo(() => {
    // If session has custom court, use it
    if (sessionData.courtName && sessionData.courtAddress) {
      const match = PRESET_COURTS.find((c) => c.name === sessionData.courtName);
      if (match) return match;
      return {
        id: "custom",
        name: sessionData.courtName,
        address: sessionData.courtAddress,
        courtNumber: sessionData.courtNumber || "Sân 1, Sân 2",
        lat: 21.042588,
        lng: 105.837391,
      };
    }
    const preset = PRESET_COURTS.find((c) => c.id === selectedCourtId);
    return (
      preset ||
      PRESET_COURTS[0] || {
        id: "quan-thanh",
        name: "Nhà Thi Đấu Quán Thánh",
        address: "115 Quán Thánh, Ba Đình, Hà Nội",
        courtNumber: "Sân 1, Sân 2",
        lat: 21.042588,
        lng: 105.837391,
      }
    );
  }, [sessionData, selectedCourtId]);

  const [currentDateStr, setCurrentDateStr] = useState<string>("10/10/2026");

  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
  }, []);

  const displayDate = useMemo(() => {
    if (sessionData.matchDate) {
      const parts = sessionData.matchDate.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return currentDateStr;
  }, [sessionData.matchDate, currentDateStr]);

  const orderCode = sessionData.orderNumber || "CL-261010-8821";
  const serialNum = sessionData.serialNumber || "826101088210";
  const barcodeBars = useMemo(() => generateUpcBarcodeBars(serialNum), [serialNum]);

  const handleTear = () => {
    setIsTorn(true);
    playPaperTearSound();

    // Trigger haptic feedback if available on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 50, 40]);
    }

    // Fire confetti celebration
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  const handleReset = () => {
    setIsTorn(false);
    setTearKey((prev) => prev + 1);
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${activeCourt.name}, ${activeCourt.address}`
  )}`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden">
      {/* Background Ambient Rays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-full max-w-5xl h-[420px] sm:h-[500px] -z-10 opacity-70 dark:opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black_40%,transparent_75%)]"
      >
        <SideRays
          origin="top-right"
          rayColor1="#10B981"
          rayColor2="#3B82F6"
          speed={1.8}
          intensity={3}
          spread={3}
          opacity={0.8}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Về máy tính tiền</span>
        </Link>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setOrientation("horizontal");
                setTearKey((k) => k + 1);
                setIsTorn(false);
              }}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                orientation === "horizontal"
                  ? "bg-[var(--accent)] text-white font-bold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              title="Vé dạng ngang (Desktop & Tablet)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ngang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOrientation("vertical");
                setTearKey((k) => k + 1);
                setIsTorn(false);
              }}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                orientation === "vertical"
                  ? "bg-[var(--accent)] text-white font-bold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
              title="Vé dạng dọc (Mobile)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dọc</span>
            </button>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer shadow-2xs"
            title="Sao chép link vé vào sân"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-6 max-w-4xl mx-auto w-full z-10">
        {/* Title & Badge */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>React Bits Tear Ticket • Micro Interaction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">
            Vé Vào Sân Thi Đấu Cầu Lông
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-md mx-auto">
            Kéo hoặc xé cuống vé bên phải để xác nhận check-in vào sân cùng CLB{" "}
            <span className="font-semibold text-[var(--text)]">FC Rất Chuyên</span>.
          </p>
        </div>

        {/* TearTicket Component Stage */}
        <div className="w-full flex items-center justify-center my-2 sm:my-4">
          <TearTicket
            key={`${orientation}-${tearKey}`}
            image="/team-photo.jpg"
            imageAlt="Đội hình FC Rất Chuyên Badminton Club"
            orientation={orientation}
            width={orientation === "horizontal" ? 480 : 340}
            height={orientation === "horizontal" ? 270 : 470}
            stubSize={orientation === "horizontal" ? 150 : 135}
            radius={18}
            holes={orientation === "horizontal" ? 12 : 10}
            holeSize={7}
            notch={4}
            roughness={0.6}
            tearAngle={28}
            stretch={36}
            resistance={0.4}
            rotate={3}
            tilt={true}
            tiltMax={9}
            tiltReach={280}
            parallax={8}
            background="#18181b"
            stubBackground="#1f1f23"
            color="#f4f4f5"
            border={true}
            borderColor="rgba(255, 255, 255, 0.15)"
            borderWidth={1}
            recenter={true}
            onTear={handleTear}
            stub={
              /* Ticket Stub Content (Tearable part) */
              <div className="h-full w-full p-3.5 flex flex-col justify-between text-white font-mono select-none relative">
                {/* Perforation guide indicator */}
                <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-widest border-b border-dashed border-white/20 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-amber-400 rotate-90" />
                    <span>CUỐNG VÉ</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px]">
                    ADMIT ONE
                  </span>
                </div>

                {/* Match Court & Date details on Stub */}
                <div className="my-auto space-y-1 text-center py-2">
                  <div className="text-[10px] text-white/60 uppercase">SÂN THI ĐẤU</div>
                  <div className="text-xs font-bold text-emerald-400 truncate">
                    {activeCourt.name.replace("Nhà Thi Đấu ", "NTĐ ")}
                  </div>
                  <div className="text-[11px] font-semibold text-white/90">
                    {sessionData.courtNumber || "Sân 1, Sân 2"}
                  </div>
                  <div className="text-[10px] text-white/50">{displayDate}</div>
                </div>

                {/* Barcode Strip & Drag Indicator on Stub */}
                <div className="border-t border-dashed border-white/20 pt-2 flex flex-col items-center">
                  <svg viewBox="0 0 200 35" className="h-5 w-24 text-white opacity-80 mb-1">
                    {barcodeBars.map((bar, idx) => (
                      <rect
                        key={idx}
                        x={bar.x}
                        y={0}
                        width={bar.width}
                        height={35}
                        fill="currentColor"
                      />
                    ))}
                  </svg>
                  <span className="text-[8.5px] tracking-widest text-white/60 uppercase font-mono">
                    {orderCode}
                  </span>
                  <div className="mt-1 text-[8.5px] text-amber-300/90 font-sans font-medium animate-pulse flex items-center gap-0.5">
                    <span>✂️ Kéo xé tại đây</span>
                  </div>
                </div>
              </div>
            }
          >
            {/* Ticket Main Body Content */}
            <div className="h-full w-full p-4 sm:p-5 flex flex-col justify-between text-white select-none relative">
              {/* Top Header Badge */}
              <div className="flex items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-wider text-emerald-400 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>FC RẤT CHUYÊN</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-xs text-[10px] font-mono text-white/80 border border-white/10">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>VIP PASS</span>
                </div>
              </div>

              {/* Center Match Banner */}
              <div className="my-auto py-2 z-10">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  GIAO LƯU THỂ LỰC CLB
                </div>
                <div className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                  BUỔI THI ĐẤU CẦU LÔNG
                </div>

                {/* Court Location Details (The exact court location) */}
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-white/95 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{activeCourt.name}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-amber-300 text-[11px] font-mono shrink-0">
                      {sessionData.courtNumber || "Sân 1, Sân 2"}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-white/70 pl-5 truncate">
                    {activeCourt.address}
                  </div>
                </div>
              </div>

              {/* Bottom Metadata Grid */}
              <div className="pt-2 border-t border-dashed border-white/20 grid grid-cols-2 gap-2 text-[10px] font-mono text-white/80 z-10">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">{displayDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>19:30 - 22:30 PM</span>
                </div>
              </div>

              {/* Rubber "USED / ĐÃ CHECK-IN" Stamp when torn */}
              <div className="hidden group-data-[used]:flex absolute inset-0 items-center justify-center pointer-events-none z-30 transition-all duration-300">
                <div className="rotate-[-12deg] border-4 border-rose-500/90 text-rose-500 font-black tracking-widest text-base sm:text-2xl px-5 py-2 rounded-xl uppercase shadow-2xl bg-black/60 backdrop-blur-xs flex flex-col items-center animate-in zoom-in-75 duration-200">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                    <span>ĐÃ CHECK-IN</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] tracking-widest text-rose-400 font-mono">
                    FC RẤT CHUYÊN • VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </TearTicket>
        </div>

        {/* Dynamic Status / Reset Controls */}
        <div className="mt-5 w-full max-w-md flex flex-col items-center gap-3">
          {isTorn ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Vé đã được xé &amp; check-in thành công!</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Cuống vé đã rời khỏi thân vé. Bạn đã sẵn sàng vào sân cùng các tay vợt FC Rất Chuyên!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dán lại vé (Thử lại)</span>
                </button>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Chỉ đường tới sân</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-[var(--muted)] flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              <span>Dùng chuột hoặc ngón tay giữ cuống vé bên phải và kéo sang để xé</span>
            </div>
          )}

          {/* Court Location Card */}
          <div className="w-full p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xs space-y-2 mt-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Địa điểm thi đấu</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase">
                {activeCourt.courtNumber || "Sân 1, Sân 2"}
              </span>
            </div>

            <div className="text-xs">
              <div className="font-semibold text-[var(--text)]">{activeCourt.name}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {activeCourt.address}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Mở trên Google Maps</span>
              </a>

              {/* Court Preset selector */}
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="text-[11px] px-2 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] cursor-pointer outline-none"
                title="Đổi sân thi đấu"
              >
                {PRESET_COURTS.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]/60 z-10">
        <span>Cầu Lông Rất Chuyên • FC Rất Chuyên Badminton Club © 2026</span>
        {copiedShare && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            ✓ Đã sao chép đường dẫn vé vào sân!
          </div>
        )}
      </footer>
    </div>
  );
}

export default TicketView;
