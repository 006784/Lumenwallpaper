"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { GRADIENTS } from "@/lib/gradients";
import type { GradientKey } from "@/types/home";

type WallpaperCoverImageProps = {
  src: string | undefined;
  alt: string;
  gradient: GradientKey;
  sizes?: string;
  imageClassName?: string;
  gradientClassName?: string;
};

/**
 * Renders a wallpaper image with automatic gradient fallback.
 * Falls back to the gradient when src is absent or the image fails to load.
 */
export function WallpaperCoverImage({
  src,
  alt,
  gradient,
  sizes,
  imageClassName,
  gradientClassName,
}: WallpaperCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn("absolute inset-0", gradientClassName)}
        style={{ backgroundImage: GRADIENTS[gradient] }}
      />
    );
  }

  return (
    <Image
      fill
      unoptimized
      alt={alt}
      className={cn("object-cover object-center", imageClassName)}
      sizes={sizes}
      src={src}
      onError={() => setFailed(true)}
    />
  );
}
