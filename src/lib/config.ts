import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface NimroboConfig {
  API_BASE_URL: string;
  NET_API_BASE_URL: string;
  API_KEY: string | null;
  defaultProject: string | null;
  context: {
    orgId: string | null;
    postId: string | null;
    channelId: string | null;
    userId: string | null;
  };
}

const CONFIG_DIR = join(homedir(), '.nimrobo');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadConfig(): NimroboConfig | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getApiKey(): string | null {
  const config = loadConfig();
  return config?.API_KEY ?? null;
}

export function getNetApiBaseUrl(): string {
  const config = loadConfig();
  return config?.NET_API_BASE_URL ?? 'https://net-315108406092.asia-south1.run.app';
}
