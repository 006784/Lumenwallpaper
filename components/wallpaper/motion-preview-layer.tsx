"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MotionPreviewLayerProps = {
  videoUrl: string;
  className?: string;
  videoClassName?: string;
};

export function MotionPreviewLayer({
  videoUrl,
  className,
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
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35);
      },
      {
        threshold: [0.35],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!isVisible) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300 ease-out",
          isReady ? "opacity-100" : "opacity-0",
          videoClassName,
        )}
        autoPlay
        disablePictureInPicture
        loop
        muted
        playsInline
        preload="metadata"
        src={videoUrl}
        onCanPlay={() => {
          setIsReady(true);
        }}
      />
    </div>
  );
}
