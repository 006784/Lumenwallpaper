import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TickerStrip } from "@/components/sections/ticker-strip";

const meta = {
  title: "Sections/TickerStrip",
  component: TickerStrip,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component:
          "Horizontally scrolling ticker. Animates continuously; hover to pause. Content is sourced from `lib/data/home`.",
      },
    },
  },
} satisfies Meta<typeof TickerStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
