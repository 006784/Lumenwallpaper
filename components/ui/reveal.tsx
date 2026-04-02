"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** 对直接子元素逐个交错入场 */
  stagger?: boolean;
  /** 初始 Y 偏移（px） */
  y?: number;
  duration?: number;
  delay?: number;
}

export function Reveal({
  children,
  className,
  stagger = false,
  y = 40,
  duration = 0.65,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const targets = stagger ? Array.from(el.children) : el;

        gsap.from(targets, {
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          y,
          opacity: 0,
          duration,
          delay,
          stagger: stagger ? 0.09 : 0,
          ease: "power2.out",
          clearProps: "transform,opacity",
        });
      }, el);
    })();

    return () => ctx?.revert();
  }, [stagger, y, duration, delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
