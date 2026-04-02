import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import type { Wallpaper } from "@/types/wallpaper";

const baseWallpaper: Wallpaper = {
  id: "w-001",
  userId: "u-001",
  title: "Pacific Drift",
  slug: "pacific-drift",
  description: "A serene ocean scene captured at golden hour.",
  videoUrl: null,
  status: "published",
  tags: ["ocean", "sunset", "minimal"],
  aiTags: ["blue tones", "calm", "nature"],
  aiCategory: "nature",
  aiCaption: "Waves at dusk",
  aiProvider: "openai",
  aiModel: "gpt-4o",
  aiAnalysisStatus: "completed",
  aiAnalysisError: null,
  aiAnalyzedAt: "2024-03-01T12:00:00Z",
  colors: ["#1a3a5c", "#2d6a9f", "#f4c347"],
  width: 3840,
  height: 2160,
  downloadsCount: 1420,
  likesCount: 312,
  reportsCount: 0,
  featured: false,
  licenseConfirmedAt: "2024-01-01T00:00:00Z",
  licenseVersion: "1.0",
  lastReportedAt: null,
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
  files: [],
  creator: null,
};

const meta = {
  title: "Wallpaper/WallpaperGridCard",
  component: WallpaperGridCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "paper" },
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WallpaperGridCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { wallpaper: baseWallpaper },
};

export const WithCreator: Story = {
  args: {
    wallpaper: {
      ...baseWallpaper,
      creator: {
        id: "u-002",
        email: null,
        username: "lensmaster",
        avatarUrl: null,
        bio: null,
        createdAt: "2024-01-01T00:00:00Z",
      },
    },
  },
};

export const WithAiTagsFallback: Story = {
  name: "AI Tags (no manual tags)",
  args: {
    wallpaper: {
      ...baseWallpaper,
      tags: [],
      aiTags: ["dark", "geometric", "contrast"],
    },
  },
};

export const HighDownloads: Story = {
  name: "High Download Count",
  args: {
    wallpaper: {
      ...baseWallpaper,
      title: "Viral Gradient",
      downloadsCount: 98732,
    },
  },
};
