import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DarkroomCard } from "@/components/wallpaper/darkroom-card";

const meta = {
  title: "Wallpaper/DarkroomCard",
  component: DarkroomCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="h-[380px] w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DarkroomCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: {
      gradient: "night",
      title: "Obsidian Shore",
      meta: "Dark · Featured · 2024",
      href: "#",
    },
  },
};

export const Featured: Story = {
  args: {
    item: {
      gradient: "void",
      title: "The Abyss Looks Back",
      meta: "Abstract · Staff Pick",
      href: "#",
      badge: "Staff Pick",
      featured: true,
    },
  },
};

export const WithAiTags: Story = {
  name: "With AI Tags",
  args: {
    item: {
      gradient: "ember",
      title: "Burning Low",
      meta: "Warm · Dark · 2024",
      href: "#",
      aiTags: ["fire", "minimal"],
    },
  },
};

export const WithBadge: Story = {
  name: "With Badge",
  args: {
    item: {
      gradient: "lava",
      title: "Magma Flow",
      meta: "Nature · 4K",
      href: "#",
      badge: "New",
    },
  },
};
