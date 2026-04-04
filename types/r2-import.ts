export type R2ImportCandidateKind = "image" | "video";
export type R2ImportResultStatus = "imported" | "skipped" | "failed";

export interface R2ImportObjectInput {
  key: string;
  size: number;
  lastModified: string | null;
}

export interface R2ImportCandidate {
  key: string;
  publicUrl: string;
  size: number;
  lastModified: string | null;
  kind: R2ImportCandidateKind;
  format: string;
  mimeType: string;
  inferredTitle: string;
  alreadyImported: boolean;
  existingWallpaperId: string | null;
}

export interface R2ImportResult {
  key: string;
  status: R2ImportResultStatus;
  kind: R2ImportCandidateKind;
  title: string;
  wallpaperId: string | null;
  slug: string | null;
  message: string;
}

export interface R2ImportSummary {
  creatorUsername: string;
  scannedCount: number;
  pendingCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  candidates: R2ImportCandidate[];
  results: R2ImportResult[];
}
