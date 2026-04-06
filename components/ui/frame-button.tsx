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
          ? "border-ink bg-ink text-paper shadow-[6px_6px_0_0_rgba(10,8,4,0.09)] hover:-translate-y-0.5 hover:border-red hover:bg-red hover:shadow-[9px_9px_0_0_rgba(212,43,43,0.15)] focus-visible:border-red focus-visible:bg-red dark:border-[rgba(237,232,223,0.22)] dark:bg-[rgba(237,232,223,0.07)] dark:text-[#ede8df] dark:shadow-none dark:hover:border-gold dark:hover:bg-gold dark:hover:text-ink dark:hover:shadow-[6px_6px_0_0_rgba(245,200,66,0.18)] dark:focus-visible:border-gold dark:focus-visible:bg-gold dark:focus-visible:text-ink"
          : "border-ink bg-paper/70 text-ink shadow-[6px_6px_0_0_rgba(10,8,4,0.06)] hover:-translate-y-0.5 hover:bg-ink hover:text-paper hover:shadow-[9px_9px_0_0_rgba(10,8,4,0.12)] focus-visible:bg-ink focus-visible:text-paper dark:border-[rgba(237,232,223,0.18)] dark:bg-transparent dark:text-[#ede8df] dark:shadow-none dark:hover:border-[rgba(237,232,223,0.36)] dark:hover:bg-[rgba(237,232,223,0.06)] dark:focus-visible:border-[rgba(237,232,223,0.36)] dark:focus-visible:bg-[rgba(237,232,223,0.06)]",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
