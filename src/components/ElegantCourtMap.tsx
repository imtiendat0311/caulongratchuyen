"use client";

import React, { useEffect, useRef, useMemo } from "react";
import {
  Navigation,
  ExternalLink,
  Compass,
} from "lucide-react";
import { PRESET_COURTS } from "@/types";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  type MapRef,
} from "@/components/ui/map";

interface ElegantCourtMapProps {
  courtName: string;
  courtAddress: string;
  courtNumber: string;
}

// Plus code 2RVP+2XJ, Ba Đình, Hà Nội coordinates
const QUAN_THANH_COORDS = { lat: 21.042588, lng: 105.837391 };

export default function ElegantCourtMap({
  courtName,
  courtAddress,
  courtNumber,
}: ElegantCourtMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Determine coordinates based on preset court or fallback to Quan Thanh (2RVP+2XJ)
  const { lat, lng } = useMemo(() => {
    const found = PRESET_COURTS.find(
      (c) =>
        c.name.toLowerCase() === courtName.toLowerCase() ||
        c.address.toLowerCase().includes(courtAddress.toLowerCase()) ||
        courtAddress.toLowerCase().includes(c.address.toLowerCase())
    );
    if (found) {
      return { lat: found.lat, lng: found.lng };
    }
    return QUAN_THANH_COORDS;
  }, [courtName, courtAddress]);

  // Destination query for navigation
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}`;

  // Smoothly fly to updated coordinates when court changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1200,
      });
    }
  }, [lat, lng]);

  return (
    <div className="relative rounded-[16px] overflow-hidden border border-[var(--border)] shadow-md bg-[var(--card)] w-full transition-all">
      {/* Map Header / Location Bar */}
      <div className="p-3 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap z-10 relative">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-[var(--text)] truncate flex items-center gap-1.5">
              <span>{courtName}</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                {courtNumber || "Sân 1, Sân 2"}
              </span>
            </div>
            <div className="text-[10.5px] text-[var(--muted)] truncate">
              {courtAddress}
            </div>
          </div>
        </div>

        {/* Quick directions link buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="py-1 px-2.5 rounded-[8px] bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
            title="Mở chỉ đường trên Google Maps"
          >
            <Navigation className="w-3 h-3" />
            <span>Google Maps</span>
          </a>

          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="py-1 px-2 text-[11px] rounded-[8px] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-[var(--text)] transition-colors hidden sm:flex items-center gap-1"
            title="Mở chỉ đường trên Apple Maps"
          >
            <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
            <span>Apple Maps</span>
          </a>
        </div>
      </div>

      {/* Map Canvas powered by mapcn (MapLibre GL & CARTO Tiles) */}
      <div className="relative h-52 sm:h-64 w-full bg-neutral-100 dark:bg-[#12141c]">
        <Map
          ref={mapRef}
          center={[lng, lat]}
          zoom={16}
          className="h-full w-full"
        >

          {/* Badminton Court Marker */}
          <MapMarker longitude={lng} latitude={lat}>
            <MarkerContent>
              <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60" />
                <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-neutral-900 font-bold text-lg select-none group-hover:scale-110 transition-transform">
                  🏸
                </div>
              </div>
            </MarkerContent>

            <MarkerPopup closeButton>
              <div className="space-y-1.5 p-1 min-w-[180px]">
                <div className="text-xs font-bold text-[var(--text)] leading-tight">
                  {courtName}
                </div>
                <div className="text-[11px] text-[var(--muted)] leading-snug">
                  {courtAddress}
                </div>
                <div className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {courtNumber || "Sân 1, Sân 2"}
                </div>
                <div className="pt-1">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    <span>Mở chỉ đường Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </MarkerPopup>
          </MapMarker>
        </Map>
      </div>
    </div>
  );
}
