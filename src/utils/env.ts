const DEFAULT_LOCAL_FRONTEND_URL = "http://localhost:5173";
const DEFAULT_LOCAL_BACKEND_URL = "http://localhost:5000";

function parseCsvEnv(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = parseCsvEnv(process.env.FRONTEND_URL);
  return configuredOrigins.length > 0
    ? configuredOrigins
    : [DEFAULT_LOCAL_FRONTEND_URL, "http://localhost:3000"];
}

export function getPrimaryFrontendUrl(): string {
  const configuredOrigins = getAllowedOrigins();
  return configuredOrigins[0] || DEFAULT_LOCAL_FRONTEND_URL;
}

export function getPublicApiUrl(port: number): string {
  const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

  return process.env.PUBLIC_API_URL
    || (publicDomain ? `https://${publicDomain}` : `http://localhost:${port}`);
}

export function getPublicProfileBaseUrl(): string {
  return process.env.PUBLIC_APP_URL
    || process.env.BASE_URL
    || getPrimaryFrontendUrl();
}

export function getFallbackFrontendUrl(requestUrl?: string): string {
  if (requestUrl?.includes("localhost")) {
    return DEFAULT_LOCAL_FRONTEND_URL;
  }

  return DEFAULT_LOCAL_BACKEND_URL;
}

export function validateRequiredEnv(): void {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
  const missingVars = requiredVars.filter((key) => !process.env[key]?.trim());

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }
}
