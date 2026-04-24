export type R2UploadCorsDiagnosticStatus = "pass" | "warning" | "fail";

export type R2UploadCorsDiagnosticIssueSeverity = "warning" | "error";

export interface R2UploadCorsDiagnosticIssue {
  code: string;
  message: string;
  severity: R2UploadCorsDiagnosticIssueSeverity;
}

export interface R2UploadCorsDiagnosticHeaders {
  accessControlAllowHeaders: string | null;
  accessControlAllowMethods: string | null;
  accessControlAllowOrigin: string | null;
  accessControlExposeHeaders: string | null;
  accessControlMaxAge: string | null;
}

export interface R2UploadCorsRequirement {
  examplePolicy: Array<{
    AllowedHeaders: string[];
    AllowedMethods: string[];
    AllowedOrigins: string[];
    ExposeHeaders: string[];
    MaxAgeSeconds: number;
  }>;
  exposeHeaders: string[];
  methods: string[];
  origins: string[];
  requestHeaders: string[];
}

export interface R2UploadCorsDiagnostics {
  bucket: string;
  checkedAt: string;
  issues: R2UploadCorsDiagnosticIssue[];
  ok: boolean;
  origin: string;
  preflight: {
    ok: boolean;
    requestHeaders: string[];
    responseHeaders: R2UploadCorsDiagnosticHeaders;
    status: number | null;
  };
  publicUrl: string;
  requirements: R2UploadCorsRequirement;
  status: R2UploadCorsDiagnosticStatus;
  upload: {
    expiresIn: number;
    method: "PUT";
    signedHeaders: string[];
  };
}
