import { create } from "zustand";
import { defaultSettings, getSiteSettings } from "../services/settingsService";

interface SettingsState {
  settings: typeof defaultSettings;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  fetchSettings: async () => {
    try {
      const settings = await getSiteSettings();
      set({ settings });
    } catch {
      set({ settings: defaultSettings });
    }
  },
}));
