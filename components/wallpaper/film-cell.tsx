import { GRADIENTS } from "@/lib/gradients";
import type { FilmCellData } from "@/types/home";

type FilmCellProps = {
  cell: FilmCellData;
};

export function FilmCell({ cell }: FilmCellProps) {
  return (
    <div className="group relative min-w-0 flex-1 overflow-hidden border-r border-white/10 transition-[flex] duration-film ease-[var(--ease-film)] last:border-r-0 hover:flex-[2.6]">
      <div
        className="absolute inset-0 transition-transform duration-card ease-out group-hover:scale-[1.06]"
        style={{ backgroundImage: GRADIENTS[cell.gradient] }}
      />
      <div className="absolute bottom-3 left-3 text-[9px] uppercase tracking-[0.28em] text-paper/65 opacity-0 translate-y-2 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        {cell.label}
      </div>
    </div>
  );
}
