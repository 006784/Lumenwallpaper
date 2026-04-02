import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WallpaperVideoPlayer } from "@/components/wallpaper/wallpaper-video-player";

const meta = {
  title: "Wallpaper/WallpaperVideoPlayer",
  component: WallpaperVideoPlayer,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WallpaperVideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Pacific Drift",
    // Using a freely available test video (Big Buck Bunny clip)
    videoUrl:
      "https://www.w3schools.com/html/mov_bbb.mp4",
  },
};

export const LongTitle: Story = {
  args: {
    title: "Into the Deep — Bioluminescent Shore",
    videoUrl:
      "https://www.w3schools.com/html/mov_bbb.mp4",
  },
};
