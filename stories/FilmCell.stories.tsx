import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilmCell } from "@/components/wallpaper/film-cell";

const meta = {
  title: "Wallpaper/FilmCell",
  component: FilmCell,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="flex h-[400px] w-full border border-ink/10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FilmCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Forest: Story = {
  args: {
    cell: { gradient: "forest", label: "Into the canopy" },
  },
};

export const Ocean: Story = {
  args: {
    cell: { gradient: "ocean", label: "Deep blue" },
  },
};

export const Void: Story = {
  args: {
    cell: { gradient: "void", label: "Endless night" },
  },
};

export const Lava: Story = {
  args: {
    cell: { gradient: "lava", label: "Thermal rise" },
  },
};

export const PanelRow: Story = {
  name: "Panel Row (9 cells)",
  args: { cell: { gradient: "forest", label: "" } },
  render: () => (
    <div className="flex h-[400px] w-full">
      {(
        [
          { gradient: "forest", label: "Forest" },
          { gradient: "ocean", label: "Ocean" },
          { gradient: "void", label: "Void" },
          { gradient: "lava", label: "Lava" },
          { gradient: "dusk", label: "Dusk" },
          { gradient: "ice", label: "Ice" },
          { gradient: "ember", label: "Ember" },
          { gradient: "night", label: "Night" },
          { gradient: "blush", label: "Blush" },
        ] as const
      ).map((cell) => (
        <FilmCell key={cell.gradient} cell={cell} />
      ))}
    </div>
  ),
};
