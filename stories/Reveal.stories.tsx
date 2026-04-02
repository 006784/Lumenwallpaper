import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Reveal } from "@/components/ui/reveal";

const meta = {
  title: "UI/Reveal",
  component: Reveal,
  parameters: {
    layout: "padded",
    backgrounds: { default: "paper" },
    docs: {
      description: {
        component:
          "Scroll-triggered GSAP reveal animation. In Storybook the scroll context is limited — elements may already be visible. Use the Canvas tab and scroll to trigger.",
      },
    },
  },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="rounded border border-ink/20 bg-paper2 p-8 font-display text-2xl italic">
        Fade up on scroll.
      </div>
    ),
  },
};

export const WithStagger: Story = {
  name: "Stagger (child elements)",
  args: {
    stagger: true,
    children: (
      <>
        <div className="border-b border-ink/10 py-4 font-display text-xl italic">
          First item
        </div>
        <div className="border-b border-ink/10 py-4 font-display text-xl italic">
          Second item
        </div>
        <div className="border-b border-ink/10 py-4 font-display text-xl italic">
          Third item
        </div>
      </>
    ),
  },
};

export const CustomDuration: Story = {
  name: "Slow reveal (1.2s)",
  args: {
    duration: 1.2,
    y: 60,
    children: (
      <div className="rounded border border-ink/20 bg-paper2 p-8 font-display text-2xl italic">
        Slow and deliberate.
      </div>
    ),
  },
};
