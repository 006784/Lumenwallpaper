"use client";

import { useEffect } from "react";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { default: Lenis } = await import("lenis");

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.2,
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
    })();

    return () => cleanup?.();
  }, []);

  return <>{children}</>;
}
