import type {
  WallpaperDevicePreset,
  WallpaperDevicePresetGroup,
  WallpaperDevicePresetPlatform,
} from "@/types/wallpaper";

function createPreset(input: {
  height: number;
  id: string;
  label: string;
  platform: WallpaperDevicePresetPlatform;
  ratio: string;
  width: number;
}): WallpaperDevicePreset {
  return {
    ...input,
    aspectLabel: `${input.width} × ${input.height}`,
  };
}

export const WALLPAPER_DEVICE_PRESET_GROUPS: WallpaperDevicePresetGroup[] = [
  {
    label: "iPhone",
    platform: "iphone",
    presets: [
      createPreset({
        id: "iphone-pro",
        label: "iPhone Pro",
        platform: "iphone",
        width: 1179,
        height: 2556,
        ratio: "9:19.5",
      }),
      createPreset({
        id: "iphone-pro-max",
        label: "iPhone Pro Max",
        platform: "iphone",
        width: 1290,
        height: 2796,
        ratio: "9:19.5",
      }),
      createPreset({
        id: "iphone-plus",
        label: "iPhone Plus",
        platform: "iphone",
        width: 1284,
        height: 2778,
        ratio: "9:19.5",
      }),
    ],
  },
  {
    label: "iPad",
    platform: "ipad",
    presets: [
      createPreset({
        id: "ipad-pro-11",
        label: "iPad Pro 11",
        platform: "ipad",
        width: 2420,
        height: 1668,
        ratio: "4:3",
      }),
      createPreset({
        id: "ipad-pro-13",
        label: "iPad Pro 13",
        platform: "ipad",
        width: 2752,
        height: 2064,
        ratio: "4:3",
      }),
      createPreset({
        id: "ipad-portrait",
        label: "iPad 竖屏",
        platform: "ipad",
        width: 1668,
        height: 2420,
        ratio: "3:4",
      }),
    ],
  },
  {
    label: "Mac",
    platform: "mac",
    presets: [
      createPreset({
        id: "macbook-air",
        label: "MacBook Air",
        platform: "mac",
        width: 2560,
        height: 1664,
        ratio: "16:10",
      }),
      createPreset({
        id: "macbook-pro-14",
        label: "MacBook Pro 14",
        platform: "mac",
        width: 3024,
        height: 1964,
        ratio: "16:10",
      }),
      createPreset({
        id: "macbook-pro-16",
        label: "MacBook Pro 16",
        platform: "mac",
        width: 3456,
        height: 2234,
        ratio: "16:10",
      }),
    ],
  },
  {
    label: "Windows",
    platform: "windows",
    presets: [
      createPreset({
        id: "windows-fhd",
        label: "Windows 1080P",
        platform: "windows",
        width: 1920,
        height: 1080,
        ratio: "16:9",
      }),
      createPreset({
        id: "windows-qhd",
        label: "Windows 2K",
        platform: "windows",
        width: 2560,
        height: 1440,
        ratio: "16:9",
      }),
      createPreset({
        id: "windows-4k",
        label: "Windows 4K",
        platform: "windows",
        width: 3840,
        height: 2160,
        ratio: "16:9",
      }),
      createPreset({
        id: "windows-ultrawide",
        label: "Windows 带鱼屏",
        platform: "windows",
        width: 3440,
        height: 1440,
        ratio: "21:9",
      }),
    ],
  },
  {
    label: "Android",
    platform: "android",
    presets: [
      createPreset({
        id: "android-fhd",
        label: "Android FHD+",
        platform: "android",
        width: 1080,
        height: 2400,
        ratio: "9:20",
      }),
      createPreset({
        id: "android-qhd",
        label: "Android QHD+",
        platform: "android",
        width: 1440,
        height: 3200,
        ratio: "9:20",
      }),
      createPreset({
        id: "android-fold",
        label: "Android Fold",
        platform: "android",
        width: 1812,
        height: 2176,
        ratio: "5:6",
      }),
    ],
  },
];

export function listWallpaperDevicePresets() {
  return WALLPAPER_DEVICE_PRESET_GROUPS;
}

export function getWallpaperDevicePreset(id: string) {
  return (
    WALLPAPER_DEVICE_PRESET_GROUPS.flatMap((group) => group.presets).find(
      (preset) => preset.id === id,
    ) ?? null
  );
}
