import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MoodCard } from "@/components/wallpaper/mood-card";

const meta = {
  title: "Wallpaper/MoodCard",
  component: MoodCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "paper" },
  },
} satisfies Meta<typeof MoodCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Portrait: Story = {
  args: {
    card: {
      id: "1",
      gradient: "forest",
      shape: "portrait",
      number: "001",
      name: "Into the Canopy",
      meta: "Nature · 4K · 2024",
      href: "#",
    },
  },
};

export const Landscape: Story = {
  args: {
    card: {
      id: "2",
      gradient: "ocean",
      shape: "landscape",
      number: "002",
      name: "Pacific Depth",
      meta: "Abstract · 4K · 2024",
      href: "#",
    },
  },
};

export const Square: Story = {
  args: {
    card: {
      id: "3",
      gradient: "void",
      shape: "square",
      number: "003",
      name: "Endless Night",
      meta: "Dark · 4K · 2024",
      href: "#",
    },
  },
};

export const Tall: Story = {
  args: {
    card: {
      id: "4",
      gradient: "lava",
      shape: "tall",
      number: "004",
      name: "Thermal Rise",
      meta: "Warm · 4K · 2024",
      href: "#",
    },
  },
};

export const WithAiTags: Story = {
  name: "With AI Tags",
  args: {
    card: {
      id: "5",
      gradient: "dusk",
      shape: "portrait",
      number: "005",
      name: "Golden Hour",
      meta: "Landscape · 4K · 2024",
      href: "#",
      aiTags: ["sunset", "warm tones", "minimal"],
    },
  },
};
