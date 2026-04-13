import { useEffect, useCallback } from 'react';

/**
 * Draft form persistence hook
 * Auto-saves form data every few seconds and restores on component mount
 */
export function useDraftFormPersistence<T extends Record<string, any>>(
  formData: T,
  draftKey: string,
  autoSaveInterval: number = 5000 // 5 seconds
) {
  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      const serialized = JSON.stringify(formData);
      localStorage.setItem(`draft:${draftKey}`, serialized);
      const timestamp = new Date().toISOString();
      localStorage.setItem(`draft:${draftKey}:timestamp`, timestamp);
      console.log('[DRAFT] Saved:', draftKey);
    } catch (error) {
      console.warn('[DRAFT] Save failed:', error);
    }
  }, [formData, draftKey]);

  // Restore draft from localStorage
  const restoreDraft = useCallback((): Partial<T> | null => {
    try {
      const raw = localStorage.getItem(`draft:${draftKey}`);
      if (raw) {
        const restored = JSON.parse(raw) as Partial<T>;
        const timestamp = localStorage.getItem(`draft:${draftKey}:timestamp`);
        console.log('[DRAFT] Restored:', draftKey, timestamp);
        return restored;
      }
    } catch (error) {
      console.warn('[DRAFT] Restore failed:', error);
    }
    return null;
  }, [draftKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft:${draftKey}`);
      localStorage.removeItem(`draft:${draftKey}:timestamp`);
      console.log('[DRAFT] Cleared:', draftKey);
    } catch (error) {
      console.warn('[DRAFT] Clear failed:', error);
    }
  }, [draftKey]);

  // Auto-save on form data change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [formData, saveDraft, autoSaveInterval]);

  return {
    saveDraft,
    restoreDraft,
    clearDraft,
    hasAutoSaveSupport: true,
  };
}
