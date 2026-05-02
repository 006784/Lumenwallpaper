import type {
  OpenClawApiEndpoint,
  OpenClawAgentToolManifest,
  OpenClawMcpImportManifest,
  OpenClawToolDefinition,
  OpenClawToolManifest,
} from "@/types/openclaw-api";

export const openClawApiEndpoints: OpenClawApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/openclaw",
    description: "Read the OpenClaw management API manifest.",
  },
  {
    method: "GET",
    path: "/api/openclaw/tools",
    description: "Load an OpenClaw tool manifest that can be imported as function tools.",
  },
  {
    method: "GET",
    path: "/api/openclaw/tools/agents",
    description: "Load an OpenAI Agents friendly HTTP tool manifest for OpenClaw.",
  },
  {
    method: "GET",
    path: "/api/openclaw/tools/mcp",
    description: "Load an MCP-style HTTP tool catalog for OpenClaw integrations.",
  },
  {
    method: "GET",
    path: "/api/openclaw/health",
    description: "Inspect health, environment checks, and provider availability.",
  },
  {
    method: "POST",
    path: "/api/openclaw/tasks",
    description: "Enqueue Google Cloud Tasks for long-running wallpaper operations.",
  },
  {
    method: "POST",
    path: "/api/openclaw/upload/presign",
    description: "Create a presigned R2 upload URL for images or videos.",
  },
  {
    method: "POST",
    path: "/api/openclaw/upload/remote",
    description: "Download a remote image or video URL, upload it to R2, and create a wallpaper record.",
  },
  {
    method: "GET",
    path: "/api/openclaw/wallpapers",
    description: "List wallpapers for management workflows.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers",
    description: "Create a wallpaper record after uploading the source asset.",
  },
  {
    method: "PATCH",
    path: "/api/openclaw/wallpapers/batch",
    description: "Batch review or update wallpaper status, featured flag, and tags.",
  },
  {
    method: "GET",
    path: "/api/openclaw/wallpapers/duplicates",
    description: "Detect probable duplicate wallpapers grouped by R2 asset or fallback fingerprint.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers/duplicates/cleanup",
    description: "Preview or clean duplicate wallpapers while keeping the latest or oldest record.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers/rename",
    description: "Batch rename wallpapers using explicit titles or semantic AI/tag titles.",
  },
  {
    method: "GET",
    path: "/api/openclaw/wallpapers/{id}",
    description: "Load one wallpaper by ID or slug.",
  },
  {
    method: "PATCH",
    path: "/api/openclaw/wallpapers/{id}",
    description: "Update wallpaper metadata, tags, status, or featured flag.",
  },
  {
    method: "DELETE",
    path: "/api/openclaw/wallpapers/{id}",
    description: "Delete a wallpaper and its stored files.",
  },
  {
    method: "GET",
    path: "/api/openclaw/wallpapers/{id}/download",
    description: "Inspect available download variants, or stream one selected variant.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers/{id}/analyze",
    description: "Re-run AI analysis for one wallpaper.",
  },
  {
    method: "GET",
    path: "/api/openclaw/wallpapers/import-r2",
    description: "Scan importable R2 objects before syncing them into Supabase.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers/import-r2",
    description: "Import R2 objects into wallpapers and wallpaper_files.",
  },
  {
    method: "POST",
    path: "/api/openclaw/wallpapers/backfill",
    description: "Generate missing variants, colors, and AI metadata for wallpapers.",
  },
  {
    method: "GET",
    path: "/api/openclaw/reports",
    description: "List moderation reports and summary counts.",
  },
  {
    method: "PATCH",
    path: "/api/openclaw/reports",
    description: "Batch review moderation reports.",
  },
  {
    method: "GET",
    path: "/api/openclaw/reports/{id}",
    description: "Load one moderation report by ID.",
  },
  {
    method: "PATCH",
    path: "/api/openclaw/reports/{id}",
    description: "Update one moderation report review result.",
  },
];

export const openClawToolDefinitions: OpenClawToolDefinition[] = [
  {
    name: "openclaw_health",
    description: "Check whether Lumen is healthy and whether Supabase, R2, auth, and AI providers are ready.",
    method: "GET",
    path: "/api/openclaw/health",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_enqueue_cloud_task",
    description: "Enqueue a Google Cloud Task that calls a long-running OpenClaw wallpaper operation asynchronously.",
    method: "POST",
    path: "/api/openclaw/tasks",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["reanalyze_wallpapers", "backfill_wallpapers"],
        },
        body: {
          type: "object",
          additionalProperties: true,
        },
        scheduleTime: {
          type: "string",
          description: "Optional RFC3339 timestamp for delayed execution.",
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_upload_presign",
    description: "Create a presigned upload URL in R2 for an image or video file.",
    method: "POST",
    path: "/api/openclaw/upload/presign",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        contentType: {
          type: "string",
          enum: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
        },
        size: { type: "integer", minimum: 1 },
      },
      required: ["filename", "contentType", "size"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_upload_remote_wallpaper",
    description: "Create a wallpaper from a remote image or video URL, useful for Telegram file URLs. Lumen downloads the file, uploads it to R2, and creates the wallpaper record.",
    method: "POST",
    path: "/api/openclaw/upload/remote",
    inputSchema: {
      type: "object",
      properties: {
        sourceUrl: { type: "string", format: "uri" },
        posterSourceUrl: {
          type: "string",
          format: "uri",
          description: "Optional poster image URL for video wallpapers.",
        },
        title: { type: "string" },
        description: { type: "string" },
        filename: { type: "string" },
        contentType: {
          type: "string",
          enum: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
        },
        directory: {
          type: "string",
          description: "Optional R2 subdirectory under originals/previews/etc, e.g. telegram or motion-videos.",
        },
        tags: { type: "array", items: { type: "string" } },
        colors: { type: "array", items: { type: "string" } },
        width: { type: "integer" },
        height: { type: "integer" },
        featured: { type: "boolean" },
        status: { type: "string", enum: ["processing", "published", "rejected"] },
        licenseAccepted: {
          type: "boolean",
          description: "Defaults to true for trusted OpenClaw automation.",
        },
        skipAiEnrichment: { type: "boolean" },
        skipVariantGeneration: { type: "boolean" },
        creator: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            username: { type: "string" },
            bio: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      required: ["sourceUrl", "title"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_list_wallpapers",
    description: "List wallpapers with filters for search, category, tag, status, featured, and motion.",
    method: "GET",
    path: "/api/openclaw/wallpapers",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100 },
        q: { type: "string" },
        tag: { type: "string" },
        category: { type: "string" },
        sort: { type: "string", enum: ["latest", "popular", "likes"] },
        status: { type: "string", enum: ["processing", "published", "rejected"] },
        featured: { type: "boolean" },
        motion: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_create_wallpaper",
    description: "Create a wallpaper record after upload. Pair this with openclaw_upload_presign.",
    method: "POST",
    path: "/api/openclaw/wallpapers",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        videoUrl: { type: "string", format: "uri" },
        tags: { type: "array", items: { type: "string" } },
        colors: { type: "array", items: { type: "string" } },
        width: { type: "integer" },
        height: { type: "integer" },
        featured: { type: "boolean" },
        status: { type: "string", enum: ["processing", "published", "rejected"] },
        licenseAccepted: { type: "boolean" },
        licenseVersion: { type: "string" },
        creator: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            username: { type: "string" },
            bio: { type: "string" },
          },
          additionalProperties: false,
        },
        original: {
          type: "object",
          properties: {
            storagePath: { type: "string" },
            url: { type: "string", format: "uri" },
            size: { type: "integer" },
            format: { type: "string" },
            contentType: { type: "string" },
            width: { type: "integer" },
            height: { type: "integer" },
          },
          required: ["storagePath", "url", "size", "format"],
          additionalProperties: false,
        },
        posterOriginal: {
          type: "object",
          properties: {
            storagePath: { type: "string" },
            url: { type: "string", format: "uri" },
            size: { type: "integer" },
            format: { type: "string" },
            contentType: { type: "string" },
            width: { type: "integer" },
            height: { type: "integer" },
          },
          required: ["storagePath", "url", "size", "format"],
          additionalProperties: false,
        },
      },
      required: ["title", "licenseAccepted", "original"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_get_wallpaper",
    description: "Load one wallpaper by numeric ID, UUID, or slug.",
    method: "GET",
    path: "/api/openclaw/wallpapers/{id}",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_update_wallpaper",
    description: "Update one wallpaper title, description, videoUrl, tags, colors, featured flag, or status.",
    method: "PATCH",
    path: "/api/openclaw/wallpapers/{id}",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: ["string", "null"] },
        videoUrl: { type: ["string", "null"] },
        tags: { type: "array", items: { type: "string" } },
        colors: { type: "array", items: { type: "string" } },
        featured: { type: "boolean" },
        status: { type: "string", enum: ["processing", "published", "rejected"] },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_delete_wallpaper",
    description: "Delete a wallpaper and all stored files in R2.",
    method: "DELETE",
    path: "/api/openclaw/wallpapers/{id}",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_download_wallpaper",
    description: "Get downloadable variants for one wallpaper, or stream the chosen variant when stream=true.",
    method: "GET",
    path: "/api/openclaw/wallpapers/{id}/download",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        variant: { type: "string", enum: ["preview", "thumb", "4k", "original"] },
        stream: { type: "boolean" },
        track: { type: "boolean" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_analyze_wallpaper",
    description: "Re-run AI analysis for one wallpaper using its preview image.",
    method: "POST",
    path: "/api/openclaw/wallpapers/{id}/analyze",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_reanalyze_wallpapers",
    description: "Re-run AI analysis for a small batch of existing photo wallpapers.",
    method: "POST",
    path: "/api/openclaw/wallpapers/reanalyze",
    inputSchema: {
      type: "object",
      properties: {
        identifiers: {
          type: "array",
          items: { type: "string" },
          maxItems: 25,
        },
        status: {
          type: "string",
          enum: ["published", "processing", "rejected", "all"],
        },
        limit: { type: "integer", minimum: 1, maximum: 10 },
        offset: { type: "integer", minimum: 0 },
        dryRun: { type: "boolean" },
        geminiApiKey: {
          type: "string",
          description: "Optional request-scoped Gemini key for this batch only.",
        },
        geminiBaseUrl: { type: "string" },
        geminiModel: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_detect_duplicate_wallpapers",
    description: "Find duplicate wallpapers grouped by shared R2 asset ID or fallback fingerprint.",
    method: "GET",
    path: "/api/openclaw/wallpapers/duplicates",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100 },
        status: {
          type: "string",
          enum: ["all", "processing", "published", "rejected"],
        },
        reason: {
          type: "string",
          enum: ["all", "asset_id", "fallback_fingerprint"],
        },
        creator: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_cleanup_duplicate_wallpapers",
    description:
      "Preview or delete duplicate wallpapers. By default, only exact shared-asset duplicates are cleaned and the latest wallpaper is kept.",
    method: "POST",
    path: "/api/openclaw/wallpapers/duplicates/cleanup",
    inputSchema: {
      type: "object",
      properties: {
        creator: { type: "string" },
        dryRun: { type: "boolean" },
        groupKeys: {
          type: "array",
          items: { type: "string" },
        },
        keep: { type: "string", enum: ["latest", "oldest"] },
        limit: { type: "integer", minimum: 1, maximum: 100 },
        reason: {
          type: "string",
          enum: ["asset_id", "fallback_fingerprint", "all"],
        },
        status: {
          type: "string",
          enum: ["all", "processing", "published", "rejected"],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_batch_rename_wallpapers",
    description: "Batch rename wallpapers either with explicit names or semantic AI/tag titles.",
    method: "POST",
    path: "/api/openclaw/wallpapers/rename",
    inputSchema: {
      type: "object",
      properties: {
        strategy: { type: "string", enum: ["explicit", "displayTitle"] },
        fallbackTitle: { type: "string" },
        wallpaperIds: {
          type: "array",
          items: { type: "string" },
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
            },
            required: ["id", "title"],
            additionalProperties: false,
          },
        },
      },
      required: ["strategy"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_batch_update_wallpapers",
    description: "Batch review or update wallpaper status, featured flag, and tags.",
    method: "PATCH",
    path: "/api/openclaw/wallpapers/batch",
    inputSchema: {
      type: "object",
      properties: {
        wallpaperIds: {
          type: "array",
          items: { type: "string" },
        },
        status: { type: "string", enum: ["processing", "published", "rejected"] },
        featured: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
        appendTags: { type: "array", items: { type: "string" } },
        removeTags: { type: "array", items: { type: "string" } },
      },
      required: ["wallpaperIds"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_scan_r2_import",
    description: "Scan the R2 bucket for importable objects that are not yet in Supabase.",
    method: "GET",
    path: "/api/openclaw/wallpapers/import-r2",
    inputSchema: {
      type: "object",
      properties: {
        continuationToken: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_import_r2_objects",
    description: "Import scanned R2 objects into wallpapers and wallpaper_files.",
    method: "POST",
    path: "/api/openclaw/wallpapers/import-r2",
    inputSchema: {
      type: "object",
      properties: {
        objects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              size: { type: "integer" },
              lastModified: { type: ["string", "null"] },
            },
            required: ["key", "size"],
            additionalProperties: false,
          },
        },
        creatorUsername: { type: "string" },
      },
      required: ["objects"],
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_backfill_wallpapers",
    description: "Generate missing variants, colors, and AI metadata for one creator or specific wallpaper IDs.",
    method: "POST",
    path: "/api/openclaw/wallpapers/backfill",
    inputSchema: {
      type: "object",
      properties: {
        creatorUsername: { type: "string" },
        wallpaperIds: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_list_reports",
    description: "List moderation reports with filters for creator, reason, search, and status.",
    method: "GET",
    path: "/api/openclaw/reports",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100 },
        creator: { type: "string" },
        reason: {
          type: "string",
          enum: ["copyright", "sensitive", "spam", "misleading", "other", "all"],
        },
        search: { type: "string" },
        status: {
          type: "string",
          enum: ["all", "open", "pending", "reviewing", "resolved", "dismissed"],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "openclaw_batch_review_reports",
    description: "Batch review moderation reports and optionally update the related wallpaper status.",
    method: "PATCH",
    path: "/api/openclaw/reports",
    inputSchema: {
      type: "object",
      properties: {
        reportIds: {
          type: "array",
          items: { type: "string" },
        },
        status: {
          type: "string",
          enum: ["pending", "reviewing", "resolved", "dismissed"],
        },
        reviewNote: { type: ["string", "null"] },
        wallpaperStatus: {
          type: "string",
          enum: ["processing", "published", "rejected"],
        },
      },
      required: ["reportIds", "status"],
      additionalProperties: false,
    },
  },
];

export function buildOpenClawToolManifest(): OpenClawToolManifest {
  return {
    format: "openai-function-tools-v1",
    tools: openClawToolDefinitions.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        xHttp: {
          method: tool.method,
          path: tool.path,
        },
      },
    })),
  };
}

export function buildOpenClawAgentToolManifest(
  baseUrl: string,
): OpenClawAgentToolManifest {
  return {
    format: "openai-agents-http-tools-v1",
    baseUrl,
    auth: {
      type: "apiKey",
      primaryHeader: "Authorization: Bearer <OPENCLAW_API_KEY>",
      fallbackHeaders: ["x-openclaw-key", "x-api-key"],
    },
    tools: openClawToolDefinitions.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {
        readOnlyHint: tool.method === "GET",
      },
      http: {
        method: tool.method,
        path: tool.path,
        contentType: "application/json",
      },
    })),
  };
}

export function buildOpenClawMcpImportManifest(
  baseUrl: string,
): OpenClawMcpImportManifest {
  return {
    format: "mcp-http-tool-catalog-v1",
    auth: {
      type: "apiKey",
      primaryHeader: "Authorization: Bearer <OPENCLAW_API_KEY>",
      fallbackHeaders: ["x-openclaw-key", "x-api-key"],
    },
    server: {
      name: "lumen-openclaw",
      version: "2026-04-03",
      instructionsUrl: new URL("/api/openclaw", baseUrl).toString(),
    },
    tools: openClawToolDefinitions.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      transport: {
        type: "http",
        method: tool.method,
        path: tool.path,
      },
    })),
  };
}
