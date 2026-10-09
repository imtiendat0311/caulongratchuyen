"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  BookmarkPlus,
  Printer,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toCanvas, toPng } from "html-to-image";
import { Member, BankConfig } from "@/types";
import { parseCourtsList } from "./CourtPickerAndMap";
import { SkeletonImage } from "./SkeletonImage";
import { RECEIPT_TEXTURE_LIGHT, RECEIPT_TEXTURE_DARK } from "@/lib/receipt-textures";
import {
  generateBillIdentifiers,
  generateUpcBarcodeBars,
  formatSerialNumber,
} from "@/lib/bill-utils";
import { RollingNumber } from "./RollingNumber";

interface CostcoReceiptProps {
  date: string; // DD/MM/YYYY
  courtName: string;
  courtAddress: string;
  courtNumber: string;
  hostMember?: Member | null;
  bankConfig: BankConfig;
  namCount: number;
  nuCount: number;
  courtCost: number;
  shuttleCost: number;
  soQua: number;
  waterCost: number;
  totalCost: number;
  finalNam: number;
  finalNu: number;
  ratio: number;
  orderNumber?: string;
  serialNumber?: string;
  onCopy: () => void;
  copied: boolean;
  onShare: () => void;
  onOpenVietQR: () => void;
  onSaveToHistory: () => void | Promise<void>;
}

function processQrToTransparent(src: string, dark: boolean): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w === 0 || h === 0) return resolve(src);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(src);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const pixels = imgData.data;
        const outData = ctx.createImageData(w, h);

        const modR = dark ? 255 : 17;
        const modG = dark ? 255 : 17;
        const modB = dark ? 255 : 17;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];

            // Preserve colored pixels (VietQR, Napas, Bank branding logos)
            const diff = Math.max(r, g, b) - Math.min(r, g, b);
            const isColored = a > 50 && diff > 22 && r > g && r > b;

            if (isColored) {
              const minVal = Math.min(g, b);
              const alpha = Math.max(0, Math.min(1, 1 - minVal / 248));
              outData.data[idx] = r;
              outData.data[idx + 1] = g;
              outData.data[idx + 2] = b;
              outData.data[idx + 3] = Math.round(alpha * 255);
            } else {
              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
              let t = (brightness - 55) / (205 - 55);
              if (t < 0) t = 0;
              if (t > 1) t = 1;
              t = t * t * (3 - 2 * t);
              const modAlpha = Math.round(255 * (1 - t));

              outData.data[idx] = modR;
              outData.data[idx + 1] = modG;
              outData.data[idx + 2] = modB;
              outData.data[idx + 3] = modAlpha;
            }
          }
        }
        ctx.putImageData(outData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export function CostcoReceipt({
  date,
  courtName,
  courtAddress,
  courtNumber,
  hostMember,
  bankConfig,
  namCount,
  nuCount,
  courtCost,
  shuttleCost,
  soQua,
  waterCost,
  totalCost,
  finalNam,
  finalNu,
  ratio,
  orderNumber,
  serialNumber,
  onCopy,
  copied,
  onShare,
  onOpenVietQR,
  onSaveToHistory,
}: CostcoReceiptProps) {
  const [receiptTheme, setReceiptTheme] = useState<"auto" | "light" | "dark">("auto");
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);

  const handleSaveToHistoryClick = async () => {
    if (isSavingHistory) return;
    setIsSavingHistory(true);
    try {
      await Promise.resolve(onSaveToHistory());
      setHistorySaved(true);
      setTimeout(() => setHistorySaved(false), 2200);
    } finally {
      setIsSavingHistory(false);
    }
  };

  useEffect(() => {
    const checkDark = () => {
      const isDocDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      const isMediaDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsSystemDark(isDocDark || isMediaDark);
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => checkDark();
    media.addEventListener("change", handleMedia);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", handleMedia);
    };
  }, []);

  const isDarkReceipt =
    receiptTheme === "dark" || (receiptTheme === "auto" && isSystemDark);

  const totalPlayers = namCount + nuCount;
  const courtsList = parseCourtsList(courtNumber);
  const courtsCount = Math.max(1, courtsList.length);
  const rawDigits = courtNumber ? courtNumber.replace(/[^0-9]/g, "") : "";
  const storeNum = rawDigits.slice(0, 4) || "01";

  // Unique Bill Identifiers & Dynamic UPC-A Barcode
  const defaultBillIds = useMemo(() => generateBillIdentifiers(date), [date]);
  const effectiveOrderNumber = orderNumber || defaultBillIds.orderNumber;
  const effectiveSerialNumber = serialNumber || defaultBillIds.serialNumber;
  const formattedSerial = useMemo(
    () => formatSerialNumber(effectiveSerialNumber),
    [effectiveSerialNumber]
  );
  const barcodeBars = useMemo(
    () => generateUpcBarcodeBars(effectiveSerialNumber),
    [effectiveSerialNumber]
  );

  // Account display
  const bankAcc = hostMember?.account_no || bankConfig.accountNo || "";
  const bankId = hostMember?.bank_id || bankConfig.bankId || "MB";
  const bankName = bankId;
  const accName =
    hostMember?.account_name ||
    bankConfig.accountName ||
    (hostMember ? hostMember.name.toUpperCase() : "FC RAT CHUYEN");
  const maskedAcc = bankAcc
    ? `**** **** **** ${bankAcc.slice(-4) || bankAcc}`
    : "**** **** **** 8371";

  const hostDisplayName = hostMember ? hostMember.name : "Host nhóm";

  const directVietQrUrl =
    bankId && bankAcc.trim()
      ? `https://img.vietqr.io/image/${bankId}-${bankAcc.trim()}-qr_only.png?addInfo=${encodeURIComponent(
          `Cau long ${effectiveOrderNumber}`
        )}&accountName=${encodeURIComponent(accName.trim())}`
      : null;

  const proxyVietQrUrl =
    bankId && bankAcc.trim()
      ? `/api/vietqr?bank=${encodeURIComponent(bankId)}&account=${encodeURIComponent(
          bankAcc.trim()
        )}&name=${encodeURIComponent(accName.trim())}&info=${encodeURIComponent(
          "Cau long FC Rat Chuyen"
        )}`
      : null;

  const qrUrl = proxyVietQrUrl || directVietQrUrl;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [processedQrs, setProcessedQrs] = useState<{
    light: string;
    dark: string;
  } | null>(null);
  const [qrImageLoaded, setQrImageLoaded] = useState(false);

  useEffect(() => {
    if (!directVietQrUrl) return;
    let isCurrent = true;

    const loadQr = async () => {
      let blob: Blob | null = null;
      // 1. Try same-origin proxy first (avoids Safari CORS & tracking prevention)
      if (proxyVietQrUrl) {
        try {
          const res = await fetch(proxyVietQrUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch {
          // fallback
        }
      }
      // 2. Fallback to direct VietQR URL
      if (!blob && directVietQrUrl) {
        try {
          const res = await fetch(directVietQrUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) {
          console.warn("Direct VietQR fetch fallback error:", e);
        }
      }

      if (!blob || !isCurrent) return;

      // 3. Convert blob to pure base64 Data URL (never tainted on canvas)
      let base64 = "";
      try {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Failed base64 conversion"));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob!);
        });
      } catch (err) {
        console.warn("Base64 conversion error:", err);
        return;
      }

      if (!isCurrent) return;
      setQrDataUrl(base64);
      // 4. Pixel-process transparent & dark-mode variants using safe base64 image
      try {
        const [lightUrl, darkUrl] = await Promise.all([
          processQrToTransparent(base64, false),
          processQrToTransparent(base64, true),
        ]);
        if (isCurrent) {
          setProcessedQrs({ light: lightUrl, dark: darkUrl });
        }
      } catch (procErr) {
        console.warn("Lỗi xử lý canvas QR:", procErr);
      }
    };

    loadQr();

    return () => {
      isCurrent = false;
    };
  }, [directVietQrUrl, proxyVietQrUrl]);

  const displayQrSrc = qrUrl
    ? isDarkReceipt
      ? processedQrs?.dark || null
      : processedQrs?.light || null
    : null;

  const fallbackQrSrc = qrDataUrl || directVietQrUrl || qrUrl;
  const activeQrDataUrl = displayQrSrc || fallbackQrSrc;
  const isQrReady = Boolean(processedQrs || qrDataUrl || qrImageLoaded);

  const receiptRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrImgRef = useRef<HTMLImageElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const isExportingImage = isDownloading || isCopyingImage;
  const [copiedImageToast, setCopiedImageToast] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    file: File;
    platform: "ios" | "android" | "desktop";
  } | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleSharePreview = async () => {
    if (!previewData) return;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [previewData.file] })
    ) {
      try {
        await navigator.share({
          files: [previewData.file],
          title: "Biên lai Cầu Lông Rất Chuyên",
          text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
        });
      } catch {
        // user cancelled
      }
    }
  };

  const handleCopyPreviewImage = async () => {
    if (!previewData?.file) return;
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof window !== "undefined" &&
        window.ClipboardItem
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ [previewData.file.type]: previewData.file }),
        ]);
        setCopiedImageToast(true);
        setTimeout(() => setCopiedImageToast(false), 2500);
      }
    } catch (err) {
      console.warn("Không thể sao chép ảnh preview:", err);
    }
  };

  /**
   * Master Canvas Compositor for 100% bulletproof iOS WebKit / Safari export:
   * WebKit's SVG foreignObject notoriously drops CSS background-image and <img> elements.
   * This compositor directly layers:
   * 1. Receipt base background color
   * 2. Authentic crumpled paper texture (drawn natively via Canvas 2D ctx.drawImage)
   * 3. Crisp receipt DOM text, dashed borders, and UPC-A barcode SVG (captured on transparent background)
   * 4. VietQR code drawn directly via Canvas 2D at exact DOM coordinates (100% immune to WebKit foreignObject image bugs)
   */
  const composeReceiptBlob = async (): Promise<Blob> => {
    const node = receiptRef.current;
    if (!node) throw new Error("Không tìm thấy phần tử biên lai");

    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }

    const nodeRect = node.getBoundingClientRect();
    const width = Math.round(node.offsetWidth || nodeRect.width);
    const height = Math.round(node.scrollHeight || node.offsetHeight || nodeRect.height);

    const pixelRatio = 2.5;
    const canvasWidth = Math.round(width * pixelRatio);
    const canvasHeight = Math.round(height * pixelRatio);

    const masterCanvas = document.createElement("canvas");
    masterCanvas.width = canvasWidth;
    masterCanvas.height = canvasHeight;
    const ctx = masterCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D context");

    // 1. Layer 0: Flat receipt base color
    ctx.fillStyle = isDarkReceipt ? "#14171f" : "#fcfcfb";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Layer 1: Crumpled paper texture drawn directly via native Canvas 2D
    const activeTexture = isDarkReceipt ? RECEIPT_TEXTURE_DARK : RECEIPT_TEXTURE_LIGHT;
    try {
      const textureImg = new Image();
      textureImg.src = activeTexture;
      await new Promise<void>((resolve, reject) => {
        if (textureImg.complete) return resolve();
        textureImg.onload = () => resolve();
        textureImg.onerror = reject;
      });
      ctx.drawImage(textureImg, 0, 0, canvasWidth, canvasHeight);
    } catch (texErr) {
      console.warn("Lỗi vẽ texture lên master canvas:", texErr);
    }

    // 3. Layer 2: Prepare transparent QR source
    let activeQrSource: string | null = null;
    if (qrUrl) {
      if (isDarkReceipt && processedQrs?.dark) {
        activeQrSource = processedQrs.dark;
      } else if (!isDarkReceipt && processedQrs?.light) {
        activeQrSource = processedQrs.light;
      } else if (qrDataUrl) {
        activeQrSource = await processQrToTransparent(qrDataUrl, isDarkReceipt);
      } else {
        try {
          const fetchUrl = proxyVietQrUrl || directVietQrUrl || qrUrl;
          const res = await fetch(fetchUrl);
          if (res.ok) {
            const rawBlob = await res.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === "string") resolve(reader.result);
                else reject(new Error("Lỗi chuyển đổi base64"));
              };
              reader.onerror = reject;
              reader.readAsDataURL(rawBlob);
            });
            setQrDataUrl(base64);
            activeQrSource = await processQrToTransparent(base64, isDarkReceipt);
          }
        } catch (fetchErr) {
          console.warn("Lỗi nạp ảnh VietQR khi xuất biên lai:", fetchErr);
        }
      }
    }

    // 4. Layer 3: Capture DOM content (text, lines, UPC-A barcode SVG) on transparent background
    const exportOptions = {
      cacheBust: true,
      pixelRatio,
      width,
      height,
      filter: (domNode: Node) => {
        if (domNode instanceof HTMLElement) {
          if (domNode.dataset.receiptExportSkip === "true") {
            return false;
          }
        }
        return true;
      },
      style: {
        margin: "0",
        marginLeft: "0",
        marginRight: "0",
        marginTop: "0",
        marginBottom: "0",
        transform: "none",
        boxShadow: "none",
        borderRadius: "0",
        borderTopLeftRadius: "0",
        borderTopRightRadius: "0",
        borderBottomLeftRadius: "0",
        borderBottomRightRadius: "0",
        left: "0",
        top: "0",
        width: `${width}px`,
        maxWidth: "none",
        backgroundImage: "none",
        backgroundColor: "transparent",
      },
    };

    // Ensure all rolling numbers display final target text without in-flight rolling highlights during export
    const rollingElements = Array.from(node.querySelectorAll<HTMLElement>("[data-rolling-number='true']"));
    const savedRollingStates = rollingElements.map((el) => ({
      el,
      text: el.textContent,
      className: el.className,
      color: el.style.color,
    }));

    rollingElements.forEach((el) => {
      if (el.dataset.finalText) {
        el.textContent = el.dataset.finalText;
      }
      if (el.dataset.baseClass) {
        el.className = el.dataset.baseClass;
      }
      el.style.color = "var(--receipt-text)";
    });

    let domCanvas: HTMLCanvasElement | null = null;
    try {
      domCanvas = await toCanvas(node, exportOptions);
    } catch {
      try {
        const dataUrl = await toPng(node, { ...exportOptions, skipFonts: true });
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = canvasWidth;
        fallbackCanvas.height = canvasHeight;
        const fCtx = fallbackCanvas.getContext("2d");
        if (fCtx) {
          fCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          domCanvas = fallbackCanvas;
        }
      } catch (domErr) {
        console.warn("Lỗi toCanvas/toPng DOM:", domErr);
      }
    } finally {
      // Restore rolling elements
      savedRollingStates.forEach(({ el, text, className, color }) => {
        el.textContent = text;
        el.className = className;
        el.style.color = color;
      });
    }

    if (domCanvas) {
      ctx.drawImage(domCanvas, 0, 0, canvasWidth, canvasHeight);
    }

    // 5. Layer 4: Draw VietQR code directly onto master canvas at exact DOM coordinates
    if (qrUrl && activeQrSource) {
      try {
        let targetRect = qrImgRef.current?.getBoundingClientRect();
        if (!targetRect || targetRect.width === 0 || targetRect.height === 0) {
          targetRect = qrContainerRef.current?.getBoundingClientRect();
        }

        if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
          const qrX = Math.round((targetRect.left - nodeRect.left) * (canvasWidth / nodeRect.width));
          const qrY = Math.round((targetRect.top - nodeRect.top) * (canvasHeight / nodeRect.height));
          const qrW = Math.round(targetRect.width * (canvasWidth / nodeRect.width));
          const qrH = Math.round(targetRect.height * (canvasHeight / nodeRect.height));

          const qrImg = new Image();
          qrImg.crossOrigin = "anonymous";
          qrImg.src = activeQrSource;
          await new Promise<void>((resolve, reject) => {
            if (qrImg.complete) return resolve();
            qrImg.onload = () => resolve();
            qrImg.onerror = reject;
          });

          // Keep QR code square & centered within target bounds
          const size = Math.min(qrW, qrH);
          const drawX = Math.round(qrX + (qrW - size) / 2);
          const drawY = Math.round(qrY + (qrH - size) / 2);

          ctx.drawImage(qrImg, drawX, drawY, size, size);
        }
      } catch (qrDrawErr) {
        console.warn("Lỗi vẽ QR lên master canvas:", qrDrawErr);
      }
    }

    return new Promise<Blob>((resolve, reject) => {
      masterCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("masterCanvas.toBlob trả về null"));
      }, "image/png", 1.0);
    });
  };

  const handleCopyReceiptImage = async () => {
    if (!receiptRef.current || isCopyingImage || isDownloading) return;
    try {
      setIsCopyingImage(true);
      const blob = await composeReceiptBlob();
      const fileName = `bien-lai-cau-long-${date ? date.replace(/\//g, "-") : "session"}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const objectUrl = URL.createObjectURL(blob);

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof window !== "undefined" &&
        window.ClipboardItem
      ) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopiedImageToast(true);
          setTimeout(() => setCopiedImageToast(false), 2500);
          return;
        } catch (clipErr) {
          console.warn("ClipboardItem write failed, mở modal preview:", clipErr);
        }
      }

      // Fallback: mở modal preview
      const isIOS =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
      const isAndroid =
        typeof navigator !== "undefined" &&
        /Android/i.test(navigator.userAgent);
      const platform: "ios" | "android" | "desktop" = isIOS
        ? "ios"
        : isAndroid
        ? "android"
        : "desktop";

      setPreviewData({ url: objectUrl, file, platform });
    } catch (err) {
      console.error("Lỗi khi sao chép ảnh biên lai:", err);
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleDownloadReceiptImage = async () => {
    if (!receiptRef.current || isDownloading || isCopyingImage) return;
    try {
      setIsDownloading(true);
      const blob = await composeReceiptBlob();
      const fileName = `bien-lai-cau-long-${date ? date.replace(/\//g, "-") : "session"}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const objectUrl = URL.createObjectURL(blob);

      const isIOS =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

      const isAndroid =
        typeof navigator !== "undefined" &&
        /Android/i.test(navigator.userAgent);

      const isInAppBrowser =
        typeof navigator !== "undefined" &&
        /FBAN|FBAV|Instagram|Messenger|Zalo|Line|Twitter|MicroMessenger/i.test(
          navigator.userAgent
        );

      const platform: "ios" | "android" | "desktop" = isIOS
        ? "ios"
        : isAndroid
        ? "android"
        : "desktop";

      // 1. iOS in native Safari / Chrome: Web Share API opens native iOS Share Sheet with "Lưu hình ảnh" (Save Image to Apple Photos)
      if (isIOS && !isInAppBrowser) {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Biên lai Cầu Lông Rất Chuyên",
              text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
            });
            return;
          } catch (shareErr: unknown) {
            if (shareErr instanceof Error && shareErr.name === "AbortError") {
              return; // User cancelled native share sheet
            }
          }
        }
        // Fallback for iOS if share sheet fails: in-app preview modal
        setPreviewData({ url: objectUrl, file, platform: "ios" });
        return;
      }

      // 2. In-App Browsers on iOS or Android (Messenger, Zalo, Facebook, etc.):
      if (isInAppBrowser) {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Biên lai Cầu Lông Rất Chuyên",
              text: `Biên lai tiền sân cầu lông ngày ${date || "hôm nay"}`,
            });
            return;
          } catch (shareErr: unknown) {
            if (shareErr instanceof Error && shareErr.name === "AbortError") {
              return;
            }
          }
        }
        setPreviewData({ url: objectUrl, file, platform });
        return;
      }

      // 3. Android & Desktop: trigger native download
      const link = document.createElement("a");
      link.download = fileName;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      // On Android, show confirmation toast
      if (isAndroid) {
        setDownloadToast("✓ Đã lưu biên lai vào Thư viện ảnh / Tải về!");
        setTimeout(() => setDownloadToast(null), 3500);
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh biên lai:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const themeClass =
    receiptTheme === "light"
      ? "force-light"
      : receiptTheme === "dark"
      ? "force-dark"
      : "";

  return (
    <div className="w-full flex flex-col items-center">
      {/* Receipt Theme Mode Selector (Discreet control bar) */}
      <div className="w-full max-w-full sm:max-w-[380px] mb-2 flex items-center justify-between text-xs px-1 gap-1 flex-wrap no-print">
        <span className="text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1 shrink-0">
          <span>Biên lai chi phí</span>
        </span>
        <div className="inline-flex p-0.5 rounded-[8px] bg-[var(--card)] border border-[var(--border)] text-[10px] shrink-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("auto")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "auto"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Tự động theo giao diện hệ thống"
          >
            <Sparkles className="w-3 h-3" />
            <span>Tự động</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("light")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "light"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Giấy trắng cổ điển"
          >
            <Sun className="w-3 h-3" />
            <span>Giấy sáng</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setReceiptTheme("dark")}
            className={`px-2 py-0.5 rounded-[6px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
              receiptTheme === "dark"
                ? "bg-[var(--accent)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            title="Giấy tối hiện đại"
          >
            <Moon className="w-3 h-3" />
            <span>Giấy tối</span>
          </motion.button>
        </div>
      </div>

      {/* Receipt Paper Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        ref={receiptRef}
        className={`receipt-paper ${themeClass} relative w-full max-w-full sm:max-w-[380px] shadow-2xl rounded-[16px] border font-mono text-[11px] leading-[1.35] tracking-tight selection:bg-neutral-500/20 overflow-hidden mx-auto`}
        style={{
          backgroundImage: `url("${isDarkReceipt ? RECEIPT_TEXTURE_DARK : RECEIPT_TEXTURE_LIGHT}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Textured Paper Background Layer (Ensures visible paper grain on screen; skipped on DOM export so Canvas 2D draws texture natively) */}
        <div
          data-receipt-export-skip="true"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDarkReceipt ? RECEIPT_TEXTURE_DARK : RECEIPT_TEXTURE_LIGHT}
            alt=""
            className="h-full w-full object-cover mix-blend-multiply opacity-60 dark:mix-blend-screen dark:opacity-45"
          />
        </div>

        <div className="relative z-10 p-4 sm:p-5 pb-6 sm:pb-7">
          {/* Logo Header */}
          <div className="text-center mb-3">
            <div className="inline-flex flex-col items-center">
              {/* Brand Title */}
              <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-[var(--receipt-text)] uppercase transform -skew-x-6">
                CẦU LÔNG
              </div>
              <div className="flex items-center gap-1.5 w-full justify-center -mt-0.5">
                <div className="h-[2px] bg-[var(--receipt-brand-line)] flex-1 min-w-[20px]" />
                <span className="text-[10px] font-black tracking-widest uppercase text-[var(--receipt-text)]">
                  RẤT CHUYÊN
                </span>
                <div className="h-[2px] bg-[var(--receipt-brand-line)] flex-1 min-w-[20px]" />
              </div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--receipt-muted)] mt-0.5">
                ≡ BADMINTON CLUB ≡
              </div>
            </div>

            {/* Store & Court Address */}
            <div className="mt-2 text-center text-[10.5px] leading-tight space-y-0.5">
              <div className="font-bold text-[var(--receipt-text)]">
                Store #{storeNum.padStart(4, "0")} • {courtsCount > 1 ? `${courtsCount} SÂN (${courtNumber})` : (courtNumber || "Sân 1, Sân 2")}
              </div>
              <div className="font-semibold text-[var(--receipt-text)] uppercase">
                {courtName || "Nhà Thi Đấu Quán Thánh"}
              </div>
              <div className="text-[var(--receipt-muted)] text-[10px]">
                {courtAddress || "115 Quán Thánh, Ba Đình, Hà Nội"}
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Member & Session Info */}
          <div className="text-[10.5px] space-y-0.5 mb-2 text-[var(--receipt-text)]">
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Thành viên:</span>
              <span className="font-bold truncate text-right">
                {totalPlayers} bạn ({namCount} Nam / {nuCount} Nữ)
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Host:</span>
              <span className="font-bold truncate text-right">
                {hostDisplayName}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="text-[var(--receipt-muted)] shrink-0">Ngày chơi:</span>
              <span className="font-semibold text-right">{date || "Hôm nay"}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-1 my-2">
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">
                TIỀN SÂN ({courtsCount > 1 ? `${courtsCount} sân • ${courtNumber}` : (courtNumber || "2 giờ")})
              </span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                <RollingNumber value={courtCost} isExporting={isExportingImage} />
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">
                TIỀN CẦU ({soQua} quả)
              </span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                <RollingNumber value={shuttleCost} isExporting={isExportingImage} />
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-2 text-[var(--receipt-muted)]">TIỀN NƯỚC UỐNG</span>
              <span className="font-semibold shrink-0 text-[var(--receipt-text)]">
                <RollingNumber value={waterCost} isExporting={isExportingImage} />
              </span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Subtotal & Total */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-[var(--receipt-muted)]">
              <span>TỔNG CHI PHÍ</span>
              <RollingNumber
                value={totalCost}
                isExporting={isExportingImage}
                className="text-[var(--receipt-text)]"
              />
            </div>
            <div className="flex justify-between text-[var(--receipt-subtle)]">
              <span>THUẾ (0%)</span>
              <span>0 đ</span>
            </div>
            <div className="border-b border-[var(--receipt-dashed)] my-1" />
            <div className="flex justify-between text-sm sm:text-base font-black text-[var(--receipt-text)]">
              <span>TỔNG CỘNG</span>
              <RollingNumber
                value={totalCost}
                isExporting={isExportingImage}
                className="font-black text-[var(--receipt-text)]"
              />
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-2.5" />

          {/* Split Amount Breakdown Section */}
          <div className="border-y border-dashed border-[var(--receipt-dashed)] py-2.5 my-2 space-y-1.5">
            <div className="font-bold text-[10px] uppercase text-[var(--receipt-muted)] tracking-wider">
              KẾT QUẢ CHIA TIỀN BUỔI CHƠI
            </div>
            <div className="flex justify-between items-center text-xs gap-1">
              <span className="font-semibold text-[var(--receipt-text)] truncate">
                MỖI NAM ({namCount} bạn):
              </span>
              <RollingNumber
                value={finalNam}
                isExporting={isExportingImage}
                className="font-bold text-[var(--receipt-text)] text-sm shrink-0"
              />
            </div>
            <div className="flex justify-between items-center text-xs gap-1">
              <span className="font-semibold text-[var(--receipt-text)] truncate">
                MỖI NỮ ({nuCount} bạn{ratio !== 1 ? `, ${Math.round(ratio * 100)}%` : ""}):
              </span>
              <RollingNumber
                value={finalNu}
                isExporting={isExportingImage}
                className="font-bold text-[var(--receipt-text)] text-sm shrink-0"
              />
            </div>
          </div>

          {/* Card / Bank Transfer Info */}
          <div className="text-[10px] leading-tight space-y-1 text-[var(--receipt-muted)] my-2">
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Số tài khoản</span>
              <span className="font-semibold text-[var(--receipt-text)] truncate text-right">{maskedAcc}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Ngân hàng</span>
              <span className="text-[var(--receipt-text)] truncate text-right">
                {bankName} ({accName})
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Hình thức</span>
              <span className="text-[var(--receipt-text)] truncate text-right">CHUYỂN KHOẢN VIETQR</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Thời gian</span>
              <span className="text-[var(--receipt-text)] truncate text-right">{date} 20:30:15 PM</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Mã đơn hàng</span>
              <span className="font-mono font-bold text-[var(--receipt-text)] truncate text-right">{effectiveOrderNumber}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1 font-bold text-[var(--receipt-text)]">
              <span className="shrink-0">Trạng thái</span>
              <span className="truncate text-right">ĐÃ CHIA XONG</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0">Hoàn tất</span>
              <span className="text-[var(--receipt-text)] truncate text-right">{date} 22:15:00 PM</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />

          {/* Barcode Section */}
          <div className="flex flex-col items-center justify-center my-3 text-[var(--receipt-text)]">
            {/* Dynamic UPC-A SVG Barcode */}
            <svg
              className="w-44 sm:w-56 h-10 sm:h-11 max-w-full"
              viewBox="0 0 200 45"
              fill="currentColor"
            >
              {barcodeBars.map((bar, idx) => (
                <rect key={idx} x={bar.x} y={0} width={bar.width} height={45} />
              ))}
            </svg>
            <div className="font-mono text-[10px] tracking-[0.25em] text-[var(--receipt-muted)] mt-1">
              {formattedSerial}
            </div>
          </div>

          {/* Dashed Separator */}
          {qrUrl && <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />}

          {/* VietQR Code Section (Before Footer of Receipt) */}
          {qrUrl && (
            <div className="flex flex-col items-center justify-center my-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--receipt-text)] mb-1">
                QUÉT MÃ VIETQR THANH TOÁN
              </div>
              <div className="text-[9.5px] text-[var(--receipt-muted)] mb-2">
                Chuyển khoản trực tiếp cho {hostDisplayName}
              </div>

              {/* QR Container - Blends seamlessly into receipt paper */}
              <div
                ref={qrContainerRef}
                className="relative p-2 inline-block bg-transparent w-32 h-32 sm:w-36 sm:h-36"
              >
                {!isQrReady && (
                  <div
                    data-receipt-export-skip="true"
                    className="absolute inset-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--receipt-dashed)] bg-[var(--receipt-card)] animate-pulse transition-opacity duration-300"
                  >
                    <QrCode className="w-8 h-8 text-[var(--receipt-muted)] opacity-50 mb-1" />
                    <span className="text-[8.5px] font-mono text-[var(--receipt-subtle)]">
                      Đang nạp mã QR...
                    </span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={qrImgRef}
                  data-receipt-export-skip="true"
                  crossOrigin="anonymous"
                  src={activeQrDataUrl || directVietQrUrl || qrUrl || ""}
                  onLoad={() => setQrImageLoaded(true)}
                  alt="Mã VietQR thanh toán tiền sân"
                  className={`w-28 h-28 sm:w-32 sm:h-32 object-contain block mx-auto transition-all duration-300 ${
                    isDarkReceipt && !processedQrs
                      ? "dark:brightness-95 dark:invert dark:hue-rotate-180"
                      : "mix-blend-multiply dark:mix-blend-normal"
                  } ${
                    !isQrReady ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                />
              </div>

              <div className="text-[9.5px] text-[var(--receipt-muted)] mt-2 font-mono">
                {bankId} • {bankAcc} ({accName})
              </div>
            </div>
          )}

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[var(--receipt-dashed)] my-3" />

          {/* Footer Receipt Info */}
          <div className="text-center text-[10px] space-y-0.5 text-[var(--receipt-muted)] mt-2">
            <div>Thu ngân / Host: {hostDisplayName}</div>
            <div className="font-bold text-[var(--receipt-text)]">Cảm ơn mọi người!</div>
            <div>Hẹn gặp lại buổi sau!</div>
            <div className="mt-2 text-[var(--receipt-subtle)]">
              Số người chơi: {totalPlayers} bạn
            </div>
            <div className="text-[var(--receipt-subtle)]">
              {date} • caulongratchuyen.vercel.app
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons Toolbar Below Receipt */}
      <div className="w-full max-w-full sm:max-w-[380px] mt-3 space-y-2 no-print mx-auto">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã sao chép!" : "Sao chép Zalo"}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[var(--accent)]" />
            <span>Chia sẻ</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onOpenVietQR}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-medium text-[11px] transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Mã VietQR</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            disabled={isSavingHistory}
            onClick={handleSaveToHistoryClick}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60 ${
              historySaved
                ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-[var(--border)] hover:border-[var(--accent2)] text-[var(--text)]"
            }`}
          >
            {historySaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đã lưu lịch sử!</span>
              </>
            ) : isSavingHistory ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent2)]" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-[var(--accent2)]" />
                <span>Lưu lại lịch sử</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Download & Copy receipt image buttons */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleCopyReceiptImage}
            disabled={isDownloading || isCopyingImage}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {isCopyingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
            ) : copiedImageToast ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>{copiedImageToast ? "Đã chép ảnh!" : "Sao chép ảnh"}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleDownloadReceiptImage}
            disabled={isDownloading || isCopyingImage}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>In / Lưu biên lai</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Save-to-Photos Preview Modal (iOS & Android) */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPreviewData(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-[16px] bg-[var(--card)] border border-[var(--border)] shadow-xl p-4 flex flex-col items-center max-h-[92vh] max-h-[92dvh] overflow-y-auto"
            >
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={() => setPreviewData(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </motion.button>

              <h3 className="font-bold text-sm text-[var(--text)] mb-1">
                Lưu Biên Lai Vào Máy
              </h3>
              <p className="text-xs text-[var(--muted)] text-center mb-3 leading-relaxed">
                {previewData.platform === "ios" ? (
                  <span>
                    📱 <strong>Nhấn giữ vào ảnh 1-2 giây</strong> ➜ Chọn <strong>&quot;Lưu hình ảnh&quot;</strong> (Save Image) để lưu vào ứng dụng <strong>Ảnh</strong> của iPhone.
                  </span>
                ) : previewData.platform === "android" ? (
                  <span>
                    📱 <strong>Nhấn giữ vào ảnh 1-2 giây</strong> ➜ Chọn <strong>&quot;Tải hình ảnh xuống&quot;</strong> để lưu vào <strong>Bộ sưu tập (Gallery)</strong> của Android.
                  </span>
                ) : (
                  <span>
                    Nhấn giữ vào ảnh hoặc bấm <strong>Tải về máy</strong> để lưu biên lai.
                  </span>
                )}
              </p>

              <div className="w-full flex justify-center rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)] p-2 shadow-xs mb-3">
                <SkeletonImage
                  src={previewData.url}
                  alt="Biên lai chi phí"
                  showIcon={true}
                  wrapperClassName="max-h-[55vh] max-h-[55dvh] w-full min-h-[220px] flex items-center justify-center"
                  className="max-h-[55vh] max-h-[55dvh] w-auto object-contain rounded-sm select-auto pointer-events-auto mx-auto"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <motion.a
                  whileTap={{ scale: 0.95 }}
                  href={previewData.url}
                  download={`bien-lai-${date ? date.replace(/\//g, "-") : "session"}.png`}
                  className="flex-1 py-2 px-3 rounded-[8px] bg-[var(--accent)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về máy</span>
                </motion.a>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleCopyPreviewImage}
                  className="flex-1 py-2 px-3 rounded-[8px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedImageToast ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--accent)]" />
                  )}
                  <span>{copiedImageToast ? "Đã chép!" : "Sao chép"}</span>
                </motion.button>

                {typeof navigator !== "undefined" && typeof navigator.canShare === "function" && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSharePreview}
                    className="flex-1 py-2 px-3 rounded-[8px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Chia sẻ</span>
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="py-2 px-4 rounded-[8px] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Đóng
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification (e.g. Android direct download confirmation or copy image) */}
      <AnimatePresence>
        {(downloadToast || copiedImageToast) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{downloadToast || "✓ Đã sao chép ảnh biên lai vào bộ nhớ tạm!"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
