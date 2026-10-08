"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import type {
  Map as LeafletMap,
  TileLayer as LeafletTileLayer,
  Marker as LeafletMarker,
} from "leaflet";
import {
  Navigation,
  ExternalLink,
  LocateFixed,
  Plus,
  Minus,
  Compass,
} from "lucide-react";
import { PRESET_COURTS } from "@/types";

interface ElegantCourtMapProps {
  courtName: string;
  courtAddress: string;
  courtNumber: string;
}

// Light & Dark CartoDB Tiles (Ultra-clean, minimalist, zero clutter)
const TILES = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export default function ElegantCourtMap({
  courtName,
  courtAddress,
  courtNumber,
}: ElegantCourtMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Determine coordinates based on preset court or fallback to Hanoi center
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
    // Default Hanoi coordinates
    return { lat: 21.0427, lng: 105.8415 };
  }, [courtName, courtAddress]);

  // Destination query for navigation
  const query = encodeURIComponent(`${courtName} ${courtAddress}`.trim());
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${query}`;

  // Check dark mode dynamically with MutationObserver
  useEffect(() => {
    const checkTheme = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    let isCancelled = false;

    async function setupMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const L = (await import("leaflet")).default;
        if (isCancelled || !mapContainerRef.current) return;

        // Create map instance
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 16,
          zoomControl: false, // Custom controls
          attributionControl: false, // Sleek custom badge
        });

        // Add base tile layer
        const tileConfig = isDarkMode ? TILES.dark : TILES.light;
        const tileLayer = L.tileLayer(tileConfig.url, {
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        // Custom pulsing badminton marker icon
        const customIcon = L.divIcon({
          className: "custom-badminton-marker",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60"></span>
              <div class="relative h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-neutral-900 font-bold text-lg select-none">
                🏸
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        // Add marker
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        mapInstanceRef.current = map;
        tileLayerRef.current = tileLayer;
        markerRef.current = marker;

        setTimeout(() => {
          if (!isCancelled && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            setIsMapReady(true);
          }
        }, 150);
      } catch (err) {
        console.error("Failed to initialize Leaflet map:", err);
      }
    }

    setupMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position when court coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Update tiles when dark mode switches
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = isDarkMode ? TILES.dark : TILES.light;
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [isDarkMode]);

  // Map Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

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

      {/* Map Canvas */}
      <div className="relative h-48 sm:h-56 w-full bg-neutral-100 dark:bg-[#12141c]">
        {/* The Leaflet Container with smooth fade-in */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-0 transition-opacity duration-300 ${
            isMapReady ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Floating Custom Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1 shadow-md rounded-[10px] overflow-hidden bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-[var(--bg)] text-[var(--text)] transition-colors cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-[1px] bg-[var(--border)]" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-[var(--bg)] text-[var(--text)] transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="h-[1px] bg-[var(--border)]" />
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 hover:bg-[var(--bg)] text-[var(--accent)] transition-colors cursor-pointer"
            title="Quay lại vị trí sân"
          >
            <LocateFixed className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtle Elegant Style Attribution Badge */}
        <div className="absolute bottom-1 right-2 z-10 text-[9px] text-neutral-400 dark:text-neutral-500 bg-white/70 dark:bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs select-none">
          CartoDB • OpenStreetMap
        </div>
      </div>
    </div>
  );
}
