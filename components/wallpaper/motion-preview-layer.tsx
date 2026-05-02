"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MotionPreviewLayerProps = {
  videoUrl: string;
  className?: string;
  isActive?: boolean;
  videoClassName?: string;
};

export function MotionPreviewLayer({
  videoUrl,
  className,
  isActive = true,
  videoClassName,
}: MotionPreviewLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(
          isActive && entry.isIntersecting && entry.intersectionRatio >= 0.35,
        );
      },
      {
        threshold: [0.35],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!isActive || !isVisible) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [isActive, isVisible]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300 ease-out",
          isActive && isReady ? "opacity-100" : "opacity-0",
          videoClassName,
        )}
        autoPlay
        disablePictureInPicture
        loop
        muted
        playsInline
        preload="none"
        src={videoUrl}
        onCanPlay={() => {
          setIsReady(true);
        }}
      />
    </div>
  );
}
