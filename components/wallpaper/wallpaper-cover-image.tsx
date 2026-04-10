"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { GRADIENTS } from "@/lib/gradients";
import { cn } from "@/lib/utils";
import type { GradientKey, WallpaperCoverSource } from "@/types/home";

type WallpaperCoverImageProps = {
  src: string | undefined;
  alt: string;
  gradient: GradientKey;
  sizes?: string;
  sources?: WallpaperCoverSource[];
  imageClassName?: string;
  gradientClassName?: string;
};

/**
 * Renders a wallpaper image with automatic gradient fallback.
 * Uses the browser's native responsive image selection so remote assets can
 * load directly from the image CDN without losing srcset/sizes behavior.
 */
export function WallpaperCoverImage({
  src,
  alt,
  gradient,
  sizes,
  sources,
  imageClassName,
  gradientClassName,
}: WallpaperCoverImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const srcSet = sources?.length
    ? sources
        .filter((source) => source.src && source.width > 0)
        .map((source) => `${source.src} ${source.width}w`)
        .join(", ")
    : undefined;

  if (!src || failed) {
    return (
      <div
        className={cn("absolute inset-0", gradientClassName)}
        style={{ backgroundImage: GRADIENTS[gradient] }}
      />
    );
  }

  return (
    <img
      alt={alt}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-center",
        imageClassName,
      )}
      decoding="async"
      loading="lazy"
      sizes={sizes}
      src={src}
      srcSet={srcSet}
      onError={() => setFailed(true)}
    />
  );
}
