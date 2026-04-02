import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FrameButton } from "@/components/ui/frame-button";

const meta = {
  title: "UI/FrameButton",
  component: FrameButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "paper" },
  },
  args: {
    href: "#",
    children: "Explore Wallpapers",
  },
} satisfies Meta<typeof FrameButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: { variant: "solid" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const LongLabel: Story = {
  args: {
    variant: "solid",
    children: "Browse Darkroom Collection →",
  },
};
