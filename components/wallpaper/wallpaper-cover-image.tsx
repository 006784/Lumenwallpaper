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
  loading?: "eager" | "lazy";
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
  loading = "lazy",
}: WallpaperCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const candidates = [
    src,
    ...(sources ?? [])
      .filter((source) => source.src)
      .sort((left, right) => right.width - left.width)
      .map((source) => source.src),
  ].filter((candidate, index, array): candidate is string => {
    return Boolean(candidate) && array.indexOf(candidate) === index;
  });
  const candidatesKey = candidates.join("\n");
  const currentSrc = candidates[candidateIndex];

  useEffect(() => {
    setFailed(false);
    setCandidateIndex(0);
  }, [candidatesKey]);

  const srcSet = sources?.length
    ? sources
        .filter((source) => source.src && source.width > 0)
        .map((source) => `${source.src} ${source.width}w`)
        .join(", ")
    : undefined;

  if (!currentSrc || failed) {
    return (
      <div
        aria-label={alt}
        className={cn("absolute inset-0 overflow-hidden", gradientClassName)}
        role="img"
        style={{ backgroundImage: GRADIENTS[gradient] }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.24),transparent_28%,rgba(0,0,0,0.18)_72%),radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.28),transparent_34%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute inset-x-4 bottom-4 text-paper drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-paper/65">
            Lumen Preview
          </p>
          <p className="mt-1 line-clamp-2 font-display text-[22px] italic leading-none text-paper sm:text-[26px]">
            {alt}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-center transition-[opacity,transform] duration-500 ease-out",
        imageClassName,
      )}
      decoding="async"
      loading={loading}
      sizes={sizes}
      src={currentSrc}
      srcSet={candidateIndex === 0 ? srcSet : undefined}
      onError={() => {
        if (candidateIndex < candidates.length - 1) {
          setCandidateIndex((index) => index + 1);
          return;
        }

        setFailed(true);
      }}
    />
  );
}
