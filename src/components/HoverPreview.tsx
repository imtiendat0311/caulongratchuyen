"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface HoverTarget {
  id?: string;
  text: string;
  imageUrl: string;
  altText?: string;
  linkUrl?: string;
  subtitle?: string;
  badge?: string;
  bankInfo?: string;
}

export type HoverImagePosition = "above" | "below" | "left" | "right";

export interface HoverPreviewContextType {
  onTargetEnter: (target: HoverTarget, e: React.MouseEvent<HTMLElement>) => void;
  onTargetMove: (target: HoverTarget, e: React.MouseEvent<HTMLElement>) => void;
  onTargetLeave: () => void;
  activeTarget: HoverTarget | null;
}

const HoverPreviewContext = createContext<HoverPreviewContextType | null>(null);

export function useHoverPreview() {
  return useContext(HoverPreviewContext);
}

export interface HoverPreviewProps {
  content?: string;
  targets?: HoverTarget[];
  onTargetClick?: (target: HoverTarget, index: number) => void;
  imagePosition?: HoverImagePosition;
  enterSpeed?: number;
  exitSpeed?: number;
  maxRotation?: number;
  maxOffset?: number;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
  targetClassName?: string;
  targetPadding?: number;
  imageBorderRadius?: string;
  showImageShadow?: boolean;
  children?: ReactNode;
}

export function HoverPreview({
  content = "",
  targets = [],
  onTargetClick,
  imagePosition = "above",
  enterSpeed = 0.2,
  exitSpeed = 0.15,
  maxRotation = 12,
  maxOffset = 15,
  imageWidth = 170,
  imageHeight = 190,
  className = "",
  targetClassName = "",
  targetPadding = 4,
  imageBorderRadius = "1rem",
  showImageShadow = true,
  children,
}: HoverPreviewProps) {
  const [activeTarget, setActiveTarget] = useState<HoverTarget | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const targetElementsRef = useRef<(HTMLElement | null)[]>([]);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images
  useEffect(() => {
    if (targets && targets.length > 0) {
      targets.forEach((t) => {
        if (t.imageUrl) {
          const img = new Image();
          img.src = t.imageUrl;
        }
      });
    }
  }, [targets]);

  // Motion physics springs
  const clientXVal = useMotionValue(0);
  const clientYVal = useMotionValue(0);
  const rotateVal = useMotionValue(0);
  const offsetXVal = useMotionValue(0);
  const offsetYVal = useMotionValue(0);

  const springX = useSpring(clientXVal, { stiffness: 250, damping: 20 });
  const springY = useSpring(clientYVal, { stiffness: 250, damping: 20 });
  const springRotate = useSpring(rotateVal, { stiffness: 150, damping: 15 });
  const springOffsetX = useSpring(offsetXVal, { stiffness: 150, damping: 15 });
  const springOffsetY = useSpring(offsetYVal, { stiffness: 150, damping: 15 });

  const finalX = useTransform(() => {
    const curX = springX.get();
    const offX = springOffsetX.get();
    let posX: number;
    switch (imagePosition) {
      case "left":
        posX = curX - imageWidth - 20 + offX;
        break;
      case "right":
        posX = curX + 20 + offX;
        break;
      default:
        posX = curX - imageWidth / 2 + offX;
        break;
    }
    if (typeof window !== "undefined") {
      posX = Math.max(12, Math.min(window.innerWidth - imageWidth - 12, posX));
    }
    return posX;
  });

  const finalY = useTransform(() => {
    const curY = springY.get();
    const offY = springOffsetY.get();
    let posY: number;
    switch (imagePosition) {
      case "above":
        posY = curY - imageHeight - 20 + offY;
        // Flip below if near viewport top
        if (posY < 16) posY = curY + 28 + offY;
        break;
      case "below":
        posY = curY + 20 + offY;
        break;
      default:
        posY = curY - imageHeight / 2 + offY;
        break;
    }
    return posY;
  });

  const onTargetEnter = useCallback(
    (target: HoverTarget, e: React.MouseEvent<HTMLElement>) => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      if (!isVisible) {
        clientXVal.jump(e.clientX);
        clientYVal.jump(e.clientY);
        springX.jump(e.clientX);
        springY.jump(e.clientY);
        rotateVal.jump(0);
        springRotate.jump(0);
        offsetXVal.jump(0);
        springOffsetX.jump(0);
        offsetYVal.jump(0);
        springOffsetY.jump(0);
      }
      setActiveTarget(target);
      setIsVisible(true);
    },
    [
      isVisible,
      clientXVal,
      clientYVal,
      springX,
      springY,
      rotateVal,
      springRotate,
      offsetXVal,
      springOffsetX,
      offsetYVal,
      springOffsetY,
    ]
  );

  const onTargetMove = useCallback(
    (target: HoverTarget, e: React.MouseEvent<HTMLElement>) => {
      if (activeTarget?.text !== target.text) return;
      const x = e.clientX;
      const y = e.clientY;
      clientXVal.set(x);
      clientYVal.set(y);

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;

      const rot = Math.max(
        -maxRotation,
        Math.min(maxRotation, (dx / rect.width) * maxRotation * 2)
      );
      const offX = Math.max(
        -maxOffset,
        Math.min(maxOffset, (dx / rect.width) * maxOffset * 2)
      );
      const offY = Math.max(
        -maxOffset,
        Math.min(maxOffset, (dy / rect.height) * maxOffset * 2)
      );

      rotateVal.set(rot);
      offsetXVal.set(offX);
      offsetYVal.set(offY);
    },
    [activeTarget, maxRotation, maxOffset, clientXVal, clientYVal, rotateVal, offsetXVal, offsetYVal]
  );

  const onTargetLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveTarget(null);
      setIsVisible(false);
    }, 60);
  }, []);

  const handleTargetClick = useCallback(
    (target: HoverTarget, index: number) => {
      if (onTargetClick) {
        onTargetClick(target, index);
      } else if (target.linkUrl) {
        window.open(target.linkUrl, "_blank", "noopener,noreferrer");
      }
    },
    [onTargetClick]
  );

  return (
    <HoverPreviewContext.Provider
      value={{
        onTargetEnter,
        onTargetMove,
        onTargetLeave,
        activeTarget,
      }}
    >
      <div className={cn("relative", className)}>
        {/* Render text with placeholders if content provided */}
        {content &&
          (() => {
            const elements = [];
            let lastIndex = 0;
            const regex = /\{(\d+)\}/g;
            let match;

            while ((match = regex.exec(content)) !== null) {
              const targetIdx = parseInt(match[1], 10);
              if (match.index > lastIndex) {
                elements.push(content.slice(lastIndex, match.index));
              }

              if (targets[targetIdx]) {
                const t = targets[targetIdx];
                elements.push(
                  <span
                    key={`target-${targetIdx}`}
                    ref={(el) => {
                      targetElementsRef.current[targetIdx] = el;
                    }}
                    onMouseEnter={(e) => onTargetEnter(t, e)}
                    onMouseMove={(e) => onTargetMove(t, e)}
                    onMouseLeave={onTargetLeave}
                    onClick={() => handleTargetClick(t, targetIdx)}
                    className={cn(
                      "relative cursor-pointer transition-colors inline-block",
                      targetClassName
                    )}
                    style={{
                      padding: `${targetPadding}px`,
                      margin: `-${targetPadding}px`,
                    }}
                  >
                    {t.text}
                  </span>
                );
              }
              lastIndex = match.index + match[0].length;
            }

            if (lastIndex < content.length) {
              elements.push(content.slice(lastIndex));
            }

            return elements;
          })()}

        {/* Children elements (e.g. member toggle buttons) */}
        {children}

        {/* Floating Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 0.85,
          }}
          transition={{
            duration: isVisible ? enterSpeed : exitSpeed,
            ease: isVisible ? "easeOut" : "easeIn",
          }}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            x: finalX,
            y: finalY,
            width: imageWidth,
            height: imageHeight,
            rotate: springRotate,
            pointerEvents: "none",
            zIndex: 99999,
            willChange: "transform, opacity",
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {activeTarget && (
              <motion.div
                key={`preview-${activeTarget.id || activeTarget.text}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                  "w-full h-full relative overflow-hidden bg-[var(--card)] border border-[var(--border)] flex flex-col p-1.5 backdrop-blur-md",
                  showImageShadow && "shadow-2xl shadow-black/25 dark:shadow-black/60"
                )}
                style={{ borderRadius: imageBorderRadius }}
              >
                {/* Profile Picture */}
                <div className="w-full flex-1 relative overflow-hidden rounded-xl bg-gradient-to-b from-emerald-500/10 via-[var(--bg)] to-transparent flex items-center justify-center">
                  <img
                    src={activeTarget.imageUrl}
                    alt={activeTarget.altText || activeTarget.text}
                    className="w-full h-full object-cover select-none"
                    loading="eager"
                  />
                  {activeTarget.badge && (
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
                      <span>{activeTarget.badge}</span>
                    </div>
                  )}
                </div>

                {/* Profile Info Footer */}
                <div className="px-1.5 pt-1.5 pb-0.5 flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[var(--text)] truncate">
                      {activeTarget.text}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      🏸 FC Rất Chuyên
                    </span>
                  </div>
                  {activeTarget.subtitle && (
                    <span className="text-[10px] text-[var(--muted)] truncate">
                      {activeTarget.subtitle}
                    </span>
                  )}
                  {activeTarget.bankInfo && (
                    <span className="text-[9px] font-mono text-[var(--accent)] truncate mt-0.5">
                      {activeTarget.bankInfo}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </HoverPreviewContext.Provider>
  );
}

/**
 * Convenience Trigger Wrapper for individual buttons/elements
 */
export function HoverPreviewTrigger({
  target,
  children,
  className = "",
}: {
  target: HoverTarget;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useHoverPreview();

  if (!ctx) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn("inline-flex relative", className)}
      onMouseEnter={(e) => ctx.onTargetEnter(target, e)}
      onMouseMove={(e) => ctx.onTargetMove(target, e)}
      onMouseLeave={ctx.onTargetLeave}
    >
      {children}
    </div>
  );
}

export default HoverPreview;
