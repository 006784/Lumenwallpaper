import Link from "next/link";

import { cn } from "@/lib/utils";

type FrameButtonProps = {
  children: React.ReactNode;
  className?: string;
  href: string;
  variant?: "solid" | "outline";
};

export function FrameButton({
  children,
  className,
  href,
  variant = "solid",
}: FrameButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-[42px] items-center justify-center whitespace-nowrap border-[1.5px] px-4 py-2 text-[10px] uppercase tracking-[0.24em] transition duration-hover will-change-transform focus-visible:outline-none",
        variant === "solid"
          ? "border-ink bg-ink text-paper shadow-[6px_6px_0_0_rgba(10,8,4,0.09)] hover:-translate-y-0.5 hover:border-red hover:bg-red hover:shadow-[9px_9px_0_0_rgba(212,43,43,0.15)] focus-visible:border-red focus-visible:bg-red"
          : "border-ink bg-paper/70 text-ink shadow-[6px_6px_0_0_rgba(10,8,4,0.06)] hover:-translate-y-0.5 hover:bg-ink hover:text-paper hover:shadow-[9px_9px_0_0_rgba(10,8,4,0.12)] focus-visible:bg-ink focus-visible:text-paper",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
