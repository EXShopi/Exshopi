import { create } from "zustand";
import { defaultSettings, getSiteSettings } from "../services/settingsService";

interface SettingsState {
  settings: typeof defaultSettings;
  hasFetched: boolean;
  fetchSettings: () => Promise<void>;
}

let settingsRequest: Promise<void> | null = null;
const SETTINGS_CACHE_KEY = "exshopi-site-settings-cache-v1";
const SETTINGS_CACHE_TTL_MS = 15 * 60 * 1000;

function readCachedSettings() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - Number(parsed.timestamp) > SETTINGS_CACHE_TTL_MS) {
      return null;
    }
    return parsed.settings || null;
  } catch {
    return null;
  }
}

function writeCachedSettings(settings: typeof defaultSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        settings,
      })
    );
  } catch {
    // ignore storage failures
  }
}

const cachedSettings = readCachedSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: cachedSettings || defaultSettings,
  hasFetched: false,
  fetchSettings: async () => {
    if (get().hasFetched) return;
    if (settingsRequest) return settingsRequest;

    settingsRequest = (async () => {
    try {
      const settings = await getSiteSettings();
        writeCachedSettings(settings);
        set({ settings, hasFetched: true });
    } catch {
        set({ settings: defaultSettings, hasFetched: true });
    }
    })().finally(() => {
      settingsRequest = null;
    });

    return settingsRequest;
  },
}));
