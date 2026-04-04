import sharp from "sharp";

import {
  buildR2StoragePath,
  deleteR2Objects,
  getR2AssetId,
  getR2ObjectBuffer,
  getR2ObjectUrl,
  normalizeR2StoragePath,
  putR2Object,
} from "@/lib/r2";
import type { WallpaperVariant } from "@/types/wallpaper";

type OriginalUploadInput = {
  storagePath: string;
  url?: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
  variant?: WallpaperVariant;
};

type GeneratedWallpaperFile = {
  variant: WallpaperVariant;
  storagePath: string;
  url: string;
  size: number;
  format: string;
  width: number | null;
  height: number | null;
};

type VariantSpec = {
  variant: Extract<WallpaperVariant, "4k" | "thumb" | "preview">;
  maxDimension: number;
  quality: number;
};

const VARIANT_SPECS: VariantSpec[] = [
  {
    variant: "4k",
    maxDimension: 3840,
    quality: 88,
  },
  {
    variant: "thumb",
    maxDimension: 1440,
    quality: 86,
  },
  {
    variant: "preview",
    maxDimension: 720,
    quality: 80,
  },
];

function getNormalizedDimensions(metadata: sharp.Metadata) {
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const orientation = metadata.orientation ?? 1;

  if (!width || !height) {
    return {
      width,
      height,
    };
  }

  if (orientation >= 5 && orientation <= 8) {
    return {
      width: height,
      height: width,
    };
  }

  return {
    width,
    height,
  };
}

async function createVariantBuffer(originalBuffer: Buffer, spec: VariantSpec) {
  const transformed = sharp(originalBuffer, {
    failOn: "none",
  })
    .rotate()
    .resize({
      width: spec.maxDimension,
      height: spec.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: spec.quality,
      effort: 5,
    });

  const { data, info } = await transformed.toBuffer({
    resolveWithObject: true,
  });

  return {
    data,
    width: info.width ?? null,
    height: info.height ?? null,
    size: info.size ?? data.length,
  };
}

function encodeMetadataValue(value: string) {
  return encodeURIComponent(value).slice(0, 200);
}

export async function generateWallpaperVariantFiles(
  original: OriginalUploadInput,
) {
  const normalizedOriginalPath = normalizeR2StoragePath(original.storagePath);

  if (!normalizedOriginalPath) {
    throw new Error("Original R2 object path is required.");
  }

  const originalBuffer = await getR2ObjectBuffer(normalizedOriginalPath);
  const originalMetadata = await sharp(originalBuffer, {
    failOn: "none",
  }).metadata();
  const assetId = getR2AssetId(normalizedOriginalPath) || crypto.randomUUID();
  const createdVariantPaths: string[] = [];
  const originalDimensions = getNormalizedDimensions(originalMetadata);
  const originalFile: GeneratedWallpaperFile = {
    variant: "original",
    storagePath: normalizedOriginalPath,
    url: original.url || getR2ObjectUrl(normalizedOriginalPath),
    size: original.size || originalBuffer.length,
    format: (originalMetadata.format ?? original.format ?? "bin").toLowerCase(),
    width: original.width ?? originalDimensions.width,
    height: original.height ?? originalDimensions.height,
  };

  try {
    const variantFiles: GeneratedWallpaperFile[] = [];

    for (const spec of VARIANT_SPECS) {
      const nextPath = buildR2StoragePath({
        assetId,
        variant: spec.variant,
      });
      const variantBuffer = await createVariantBuffer(originalBuffer, spec);
      const uploadedVariant = await putR2Object({
        path: nextPath,
        body: variantBuffer.data,
        contentType: "image/webp",
        variant: spec.variant,
        metadata: {
          source: "lumen-variant-generator",
          derived_from: encodeMetadataValue(normalizedOriginalPath),
          asset_id: encodeMetadataValue(assetId),
        },
      });

      createdVariantPaths.push(uploadedVariant.path);
      variantFiles.push({
        variant: spec.variant,
        storagePath: uploadedVariant.path,
        url: uploadedVariant.url,
        size: variantBuffer.size,
        format: "webp",
        width: variantBuffer.width,
        height: variantBuffer.height,
      });
    }

    return {
      original: originalFile,
      variants: variantFiles,
      cleanupPaths: [normalizedOriginalPath, ...createdVariantPaths],
    };
  } catch (error) {
    if (createdVariantPaths.length > 0) {
      await deleteR2Objects(createdVariantPaths);
    }

    throw new Error(
      error instanceof Error
        ? `Failed to generate wallpaper variants: ${error.message}`
        : "Failed to generate wallpaper variants.",
    );
  }
}
