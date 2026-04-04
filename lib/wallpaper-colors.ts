import sharp from "sharp";

import { getR2ObjectBuffer, normalizeR2StoragePath } from "@/lib/r2";

const DEFAULT_MAX_COLORS = 5;
const DEFAULT_MIN_DISTANCE = 42;
const QUANTIZATION_STEP = 24;

type QuantizedBucket = {
  count: number;
  blueTotal: number;
  greenTotal: number;
  redTotal: number;
};

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function quantizeChannel(value: number) {
  return clampChannel(Math.round(value / QUANTIZATION_STEP) * QUANTIZATION_STEP);
}

function getColorDistance(left: [number, number, number], right: [number, number, number]) {
  const redDelta = left[0] - right[0];
  const greenDelta = left[1] - right[1];
  const blueDelta = left[2] - right[2];

  return Math.sqrt(
    redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta,
  );
}

function getSaturation(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue) / 255;
  const min = Math.min(red, green, blue) / 255;

  if (max === min) {
    return 0;
  }

  const lightness = (max + min) / 2;
  const delta = max - min;

  return lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
}

function getLuminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function scoreColorCandidate(
  rgb: [number, number, number],
  pixelCount: number,
  totalPixels: number,
) {
  const saturation = getSaturation(rgb[0], rgb[1], rgb[2]);
  const luminance = getLuminance(rgb[0], rgb[1], rgb[2]);
  const normalizedCoverage = pixelCount / Math.max(totalPixels, 1);
  const neutralPenalty =
    luminance < 12 || luminance > 245 ? 0.3 : luminance < 24 || luminance > 232 ? 0.6 : 1;

  return normalizedCoverage * (0.75 + saturation * 0.6) * neutralPenalty;
}

export async function extractWallpaperColorsFromBuffer(
  buffer: Buffer,
  options?: {
    maxColors?: number;
    minDistance?: number;
  },
) {
  const maxColors = options?.maxColors ?? DEFAULT_MAX_COLORS;
  const minDistance = options?.minDistance ?? DEFAULT_MIN_DISTANCE;
  const { data, info } = await sharp(buffer, {
    failOn: "none",
  })
    .rotate()
    .resize({
      width: 64,
      height: 64,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true,
    });

  const channels = info.channels ?? 4;
  const buckets = new Map<string, QuantizedBucket>();

  for (let index = 0; index < data.length; index += channels) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const alpha = channels > 3 ? (data[index + 3] ?? 255) : 255;

    if (alpha < 32) {
      continue;
    }

    const quantizedRed = quantizeChannel(red);
    const quantizedGreen = quantizeChannel(green);
    const quantizedBlue = quantizeChannel(blue);
    const bucketKey = `${quantizedRed},${quantizedGreen},${quantizedBlue}`;
    const bucket = buckets.get(bucketKey) ?? {
      count: 0,
      redTotal: 0,
      greenTotal: 0,
      blueTotal: 0,
    };

    bucket.count += 1;
    bucket.redTotal += red;
    bucket.greenTotal += green;
    bucket.blueTotal += blue;
    buckets.set(bucketKey, bucket);
  }

  const totalPixels = [...buckets.values()].reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
  const rankedColors = [...buckets.values()]
    .map((bucket) => {
      const averageRed = bucket.redTotal / bucket.count;
      const averageGreen = bucket.greenTotal / bucket.count;
      const averageBlue = bucket.blueTotal / bucket.count;
      const rgb: [number, number, number] = [
        averageRed,
        averageGreen,
        averageBlue,
      ];

      return {
        count: bucket.count,
        hex: rgbToHex(averageRed, averageGreen, averageBlue),
        rgb,
        score: scoreColorCandidate(rgb, bucket.count, totalPixels),
      };
    })
    .sort((left, right) => {
      return right.score - left.score || right.count - left.count;
    });

  const palette: Array<{
    hex: string;
    rgb: [number, number, number];
  }> = [];

  for (const candidate of rankedColors) {
    const isDistinct = palette.every((existing) => {
      return getColorDistance(existing.rgb, candidate.rgb) >= minDistance;
    });

    if (!isDistinct) {
      continue;
    }

    palette.push(candidate);

    if (palette.length >= maxColors) {
      break;
    }
  }

  if (palette.length < Math.min(3, maxColors)) {
    for (const candidate of rankedColors) {
      if (palette.some((existing) => existing.hex === candidate.hex)) {
        continue;
      }

      palette.push(candidate);

      if (palette.length >= maxColors) {
        break;
      }
    }
  }

  return palette.map((color) => color.hex);
}

export async function extractWallpaperColorsFromStoragePath(
  storagePath: string,
  options?: {
    maxColors?: number;
    minDistance?: number;
  },
) {
  const normalizedStoragePath = normalizeR2StoragePath(storagePath);

  if (!normalizedStoragePath) {
    throw new Error("A wallpaper storage path is required to extract colors.");
  }

  const originalBuffer = await getR2ObjectBuffer(normalizedStoragePath);
  return extractWallpaperColorsFromBuffer(originalBuffer, options);
}
