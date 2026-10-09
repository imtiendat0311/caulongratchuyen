"use client";

import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SkeletonImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
  showIcon?: boolean;
}

export function SkeletonImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  skeletonClassName = "",
  showIcon = false,
  onLoad,
  ...props
}: SkeletonImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton loading placeholder */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-slate-200 dark:bg-slate-800/80 animate-pulse flex items-center justify-center z-1 ${skeletonClassName}`}
          aria-hidden="true"
        >
          {showIcon && (
            <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-600/70" />
          )}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        {...props}
      />
    </div>
  );
}
