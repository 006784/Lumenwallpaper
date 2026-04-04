import type { Wallpaper, WallpaperDownloadOption, WallpaperStatus } from "@/types/wallpaper";

export type OpenClawHttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface OpenClawApiEndpoint {
  description: string;
  method: OpenClawHttpMethod;
  path: string;
}

export interface OpenClawApiManifest {
  agentsToolsPath?: string;
  auth: {
    fallbackHeaders: string[];
    primaryHeader: string;
    type: "apiKey";
  };
  endpoints: OpenClawApiEndpoint[];
  mcpToolsPath?: string;
  name: string;
  toolsPath?: string;
  version: string;
}

export interface OpenClawDuplicateWallpaperItem {
  createdAt: string;
  creatorUsername: string | null;
  displayTitle: string;
  downloadsCount: number;
  height: number | null;
  id: string;
  kind: "image" | "video";
  likesCount: number;
  primaryAssetPath: string | null;
  primaryAssetUrl: string | null;
  slug: string;
  status: WallpaperStatus;
  title: string;
  updatedAt: string;
  width: number | null;
}

export interface OpenClawDuplicateWallpaperGroup {
  assetId: string | null;
  count: number;
  groupKey: string;
  kind: "image" | "video";
  reason: "asset_id" | "fallback_fingerprint";
  wallpapers: OpenClawDuplicateWallpaperItem[];
}

export interface OpenClawDuplicateCleanupGroupResult {
  deletedWallpapers: OpenClawDuplicateWallpaperItem[];
  dryRun: boolean;
  groupKey: string;
  keptWallpaper: OpenClawDuplicateWallpaperItem;
  kind: "image" | "video";
  reason: "asset_id" | "fallback_fingerprint";
}

export interface OpenClawDuplicateCleanupResult {
  deletedCount: number;
  dryRun: boolean;
  groups: OpenClawDuplicateCleanupGroupResult[];
  keepStrategy: "latest" | "oldest";
  keptCount: number;
  processedGroupCount: number;
  requestedGroupCount: number;
  skippedGroupCount: number;
}

export interface OpenClawBatchRenameItemResult {
  displayTitle: string;
  id: string;
  slug: string;
  title: string;
}

export interface OpenClawBatchRenameResult {
  requestedCount: number;
  updatedCount: number;
  wallpapers: OpenClawBatchRenameItemResult[];
}

export interface OpenClawBatchWallpaperUpdateResult {
  requestedCount: number;
  updatedCount: number;
  wallpapers: Array<Wallpaper & { displayTitle: string }>;
}

export interface OpenClawDownloadDescriptor {
  displayTitle: string;
  downloadUrl: string;
  filename: string;
  options: WallpaperDownloadOption[];
  publicDownloadUrl: string;
  selectedVariant: string;
  title: string;
  wallpaperId: string;
}

export interface OpenClawToolDefinition {
  description: string;
  inputSchema: Record<string, unknown>;
  method: OpenClawHttpMethod;
  name: string;
  path: string;
}

export interface OpenClawToolManifest {
  format: "openai-function-tools-v1";
  tools: Array<{
    function: {
      description: string;
      name: string;
      parameters: Record<string, unknown>;
      xHttp: {
        method: OpenClawHttpMethod;
        path: string;
      };
    };
    type: "function";
  }>;
}

export interface OpenClawAgentToolManifest {
  auth: {
    fallbackHeaders: string[];
    primaryHeader: string;
    type: "apiKey";
  };
  baseUrl: string;
  format: "openai-agents-http-tools-v1";
  tools: Array<{
    annotations: {
      readOnlyHint: boolean;
    };
    description: string;
    http: {
      contentType: "application/json";
      method: OpenClawHttpMethod;
      path: string;
    };
    inputSchema: Record<string, unknown>;
    name: string;
  }>;
}

export interface OpenClawMcpImportManifest {
  auth: {
    fallbackHeaders: string[];
    primaryHeader: string;
    type: "apiKey";
  };
  format: "mcp-http-tool-catalog-v1";
  server: {
    instructionsUrl: string;
    name: string;
    version: string;
  };
  tools: Array<{
    description: string;
    inputSchema: Record<string, unknown>;
    name: string;
    transport: {
      method: OpenClawHttpMethod;
      path: string;
      type: "http";
    };
  }>;
}
