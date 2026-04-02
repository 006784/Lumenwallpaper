import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { CategoryBlock } from "@/components/wallpaper/category-block";

const meta = {
  title: "Wallpaper/CategoryBlock",
  component: CategoryBlock,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof CategoryBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    category: {
      gradient: "forest",
      label: "Nature",
      count: "412",
      href: "#",
    },
    expanded: false,
  },
};

export const Expanded: Story = {
  args: {
    category: {
      gradient: "ocean",
      label: "Abstract",
      count: "287",
      href: "#",
    },
    expanded: true,
  },
};

export const InteractiveStrip: Story = {
  name: "Interactive Strip",
  args: { category: { gradient: "forest", label: "Nature", count: "412", href: "#" }, expanded: false },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [active, setActive] = useState<number | null>(null);
    const categories = [
      { gradient: "forest", label: "Nature", count: "412", href: "#" },
      { gradient: "ocean", label: "Abstract", count: "287", href: "#" },
      { gradient: "void", label: "Dark", count: "196", href: "#" },
      { gradient: "lava", label: "Warm", count: "143", href: "#" },
      { gradient: "ice", label: "Minimal", count: "98", href: "#" },
    ] as const;
    return (
      <div className="flex h-[280px] border-y border-ink/20">
        {categories.map((cat, i) => (
          <CategoryBlock
            key={cat.label}
            category={cat}
            expanded={active === i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          />
        ))}
      </div>
    );
  },
};
