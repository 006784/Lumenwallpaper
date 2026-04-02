import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionHeading } from "@/components/ui/section-heading";

const meta = {
  title: "UI/SectionHeading",
  component: SectionHeading,
  parameters: {
    layout: "padded",
    backgrounds: { default: "paper" },
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: "Editorial",
    title: "Curated for the eye.",
  },
};

export const WithHint: Story = {
  args: {
    eyebrow: "Darkroom",
    title: "Selected works.",
    hint: "24 new this week",
  },
};

export const MultiLineTitle: Story = {
  args: {
    eyebrow: "Mood Board",
    title: (
      <>
        Every mood,
        <br />
        a wallpaper.
      </>
    ),
    hint: "Scroll to explore",
  },
};
