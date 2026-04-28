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
        "inline-flex min-h-[42px] items-center justify-center whitespace-nowrap px-5 py-2 text-[10px] uppercase tracking-[0.24em] transition duration-hover will-change-transform focus-visible:outline-none",
        variant === "solid"
          ? "glass-primary"
          : "glass-control text-ink hover:text-ink",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
