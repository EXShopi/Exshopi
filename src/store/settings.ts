import { create } from "zustand";
import { defaultSettings, getSiteSettings } from "../services/settingsService";

interface SettingsState {
  settings: typeof defaultSettings;
  hasFetched: boolean;
  fetchSettings: () => Promise<void>;
}

let settingsRequest: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  hasFetched: false,
  fetchSettings: async () => {
    if (get().hasFetched) return;
    if (settingsRequest) return settingsRequest;

    settingsRequest = (async () => {
    try {
      const settings = await getSiteSettings();
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
