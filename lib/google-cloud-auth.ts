import { createSign } from "node:crypto";

type GoogleServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function readServiceAccountCredentials() {
  const rawJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON?.trim();
  const rawBase64 =
    process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64?.trim();

  if (!rawJson && !rawBase64) {
    return null;
  }

  const source = rawJson ?? Buffer.from(rawBase64!, "base64").toString("utf8");
  const credentials = JSON.parse(source) as GoogleServiceAccountCredentials;

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "Google Cloud service account credentials are missing client_email or private_key.",
    );
  }

  return credentials;
}

function createJwtAssertion(
  credentials: GoogleServiceAccountCredentials,
  scopes: string[],
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
      iss: credentials.client_email,
      scope: scopes.join(" "),
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${base64UrlEncode(
    signer.sign(credentials.private_key!.replace(/\\n/g, "\n")),
  )}`;
}

export function getGoogleCloudProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT_ID?.trim() ||
    readServiceAccountCredentials()?.project_id ||
    null
  );
}

export function isGoogleServiceAccountConfigured() {
  return Boolean(
    process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64?.trim(),
  );
}

export async function getGoogleCloudAccessToken(scopes: string[]) {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.accessToken;
  }

  const credentials = readServiceAccountCredentials();

  if (!credentials) {
    throw new Error("Google Cloud service account credentials are not configured.");
  }

  const assertion = createJwtAssertion(credentials, scopes);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      assertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        error_description?: string;
        expires_in?: number;
      }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        `Google OAuth token request failed with status ${response.status}.`,
    );
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(payload.expires_in ?? 3600, 60) * 1000,
  };

  return cachedToken.accessToken;
}
