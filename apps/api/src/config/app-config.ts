import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';

export const DEFAULT_PORT = 3100;
export const DEFAULT_HOST = '0.0.0.0';
export const MEDIA_STATIC_ROOT = '/files';
const APP_DIR = resolve(__dirname, '../..');
const REPO_ROOT = resolve(APP_DIR, '../..');
const DEFAULT_UPLOADS_DIR = 'uploads';
const ENV_FILE_PATHS = [resolve(APP_DIR, '.env'), resolve(REPO_ROOT, '.env')];

let envLoaded = false;

export interface AppConfig {
  host: string;
  port: number;
  uploadsDir: string;
  publicBaseUrl: string;
  mediaStaticRoot: string;
  networkInterface?: string;
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '');

const normalizeEnvValue = (value: string) => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const loadApiEnvFile = () => {
  if (envLoaded) {
    return;
  }

  envLoaded = true;

  const envPath = ENV_FILE_PATHS.find((candidate) => existsSync(candidate));
  if (!envPath) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    const normalized = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const rawValue = normalized.slice(separatorIndex + 1);
    if (key.length === 0 || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = normalizeEnvValue(rawValue);
  }
};

const resolveAppPath = (value: string) => {
  if (isAbsolute(value)) {
    return value;
  }

  return resolve(APP_DIR, value);
};

export const loadAppConfig = (): AppConfig => {
  loadApiEnvFile();

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? DEFAULT_HOST;
  const uploadsDir = resolveAppPath(process.env.UPLOADS_DIR ?? DEFAULT_UPLOADS_DIR);
  const publicBaseUrl = normalizeBaseUrl(
    process.env.PUBLIC_BASE_URL ?? process.env.API_PUBLIC_BASE_URL ?? `http://localhost:${port}`,
  );
  const networkInterface = process.env.NETWORK_INTERFACE?.trim() || undefined;

  return {
    host,
    port,
    uploadsDir,
    publicBaseUrl,
    mediaStaticRoot: MEDIA_STATIC_ROOT,
    networkInterface,
  };
};

export const buildMediaPublicUrl = (config: AppConfig, fileName: string) => {
  const encodedSegments = fileName.split('/').map(encodeURIComponent).join('/');
  return `${config.publicBaseUrl}${config.mediaStaticRoot}/${encodedSegments}`;
};
