"use client";

import { useEffect } from "react";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 尊重系统“减少动效”偏好：直接用原生滚动，不加载 Lenis/GSAP
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { default: Lenis } = await import("lenis");

      if (cancelled) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        // 0.9 比 1.2 更跟手，减少“发黏/拖尾”的卡顿感
        duration: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      function onScroll() {
        ScrollTrigger.update();
      }
      function rafCallback(time: number) {
        lenis.raf(time * 1000);
      }

      lenis.on("scroll", onScroll);
      gsap.ticker.add(rafCallback);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(rafCallback);
        lenis.destroy();
      };
    }

    // 推迟到浏览器空闲后再初始化，避免与首屏绘制争抢主线程
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const w = window as IdleWindow;
    let idleHandle: number | undefined;
    let timer: number | undefined;

    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(() => void init());
    } else {
      timer = window.setTimeout(() => void init(), 300);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) w.cancelIdleCallback?.(idleHandle);
      if (timer !== undefined) window.clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
