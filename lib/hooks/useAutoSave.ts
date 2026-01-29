/**
 * Auto-save hook implementing FSM for file synchronization
 * Handles debouncing, race conditions, and save state management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SaveStatus } from '../types';

interface UseAutoSaveOptions {
  fileId: string | null;
  content: string;
  syncedContent: string;
  onSave: () => Promise<void>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  debounceMs?: number;
  quickDebounceMs?: number;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  forceSave: () => Promise<void>;
  retrySave: () => Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 2000; // 2 seconds
const QUICK_DEBOUNCE_MS = 500;    // 500ms for post-save dirty state

export function useAutoSave({
  fileId,
  content,
  syncedContent,
  onSave,
  onSaveSuccess,
  onSaveError,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  quickDebounceMs = QUICK_DEBOUNCE_MS,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('clean');

  // Track if user typed during save
  const isSavingRef = useRef(false);
  const contentDuringSaveRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isQuickSaveRef = useRef(false);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Save function
  const performSave = useCallback(async (contentToSave: string, isQuick: boolean = false) => {
    if (!fileId) {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');
    contentDuringSaveRef.current = contentToSave;

    try {
      await onSave();
      
      isSavingRef.current = false;
      const savedContent = contentToSave;
      contentDuringSaveRef.current = null;

      // Check if content changed during save
      if (content !== savedContent) {
        // User typed during save - mark as dirty and queue quick save
        setStatus('dirty');
        isQuickSaveRef.current = true;
        
        // Clear any existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Queue quick save with shorter debounce
        debounceTimerRef.current = setTimeout(() => {
          performSave(content, true);
        }, quickDebounceMs);
      } else {
        // Content unchanged - mark as clean
        setStatus('clean');
        isQuickSaveRef.current = false;
      }

      onSaveSuccess?.();
    } catch (error) {
      isSavingRef.current = false;
      setStatus('error');
      const err = error instanceof Error ? error : new Error('Save failed');
      onSaveError?.(err);
    }
  }, [fileId, content, quickDebounceMs, onSave, onSaveSuccess, onSaveError]);

  // Handle content changes
  useEffect(() => {
    if (!fileId) {
      return;
    }

    // If content matches synced content, mark as clean
    if (content === syncedContent && status !== 'saving') {
      setStatus('clean');
      return;
    }

    // If currently saving, just track the new content
    if (isSavingRef.current) {
      return; // Will be handled after save completes
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set dirty state
    if (status !== 'dirty') {
      setStatus('dirty');
    }

    // Determine debounce time
    const debounceTime = isQuickSaveRef.current ? quickDebounceMs : debounceMs;

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSave(content, isQuickSaveRef.current);
    }, debounceTime);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, fileId, syncedContent, status, debounceMs, quickDebounceMs, performSave]);

  // Force save (bypass debounce)
  const forceSave = useCallback(async () => {
    if (!fileId) {
      return;
    }

    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // If already saving, wait for it to complete
    if (isSavingRef.current) {
      // Wait for save to complete, then save again
      const checkInterval = setInterval(() => {
        if (!isSavingRef.current) {
          clearInterval(checkInterval);
          performSave(content, false);
        }
      }, 100);
      
      return;
    }

    await performSave(content, false);
  }, [fileId, content, performSave]);

  // Retry save on error
  const retrySave = useCallback(async () => {
    if (!fileId || status !== 'error') {
      return;
    }

    await forceSave();
  }, [fileId, status, forceSave]);

  // Initialize status when file changes
  useEffect(() => {
    if (fileId && content === syncedContent) {
      setStatus('clean');
      isQuickSaveRef.current = false;
    }
  }, [fileId, content, syncedContent]);

  return {
    status,
    forceSave,
    retrySave,
  };
}
