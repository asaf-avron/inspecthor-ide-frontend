"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useRef } from 'react';
import { apiClient } from '../api-client';
import type {
    FileListItem,
    BlueprintFileItem,
    BlueprintFileType,
    ActiveFileState,
    FileCache,
    FileType,
    FileResponse,
    BlueprintStructureResponse,
} from '../types';
import { useBlueprint } from '../blueprint-context';

// === File State Types ===
export type SaveStatus = "clean" | "dirty" | "saving" | "error";

export interface FileState {
    activeFileId: string | null;
    activeFile: ActiveFileState | null;
    dirtyFiles: Set<string>;
    fileCache: FileCache;
    files: FileListItem[];
    blueprintFiles: BlueprintFileItem[];
    selectedFileId: string | null;
    isSaving: boolean;
}

// === Action Types ===
type FileAction =
    | { type: 'SET_ACTIVE_FILE'; payload: ActiveFileState | null }
    | { type: 'SET_ACTIVE_FILE_ID'; payload: string | null }
    | { type: 'SET_SELECTED_FILE_ID'; payload: string | null }
    | { type: 'UPDATE_ACTIVE_FILE_CONTENT'; payload: string }
    | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
    | { type: 'UPDATE_FILE_CACHE'; payload: { fileId: string; content: string; fileType: string } }
    | { type: 'SET_FILES'; payload: FileListItem[] }
    | { type: 'SET_BLUEPRINT_FILES'; payload: BlueprintFileItem[] }
    | { type: 'SET_BLUEPRINT_STRUCTURE'; payload: BlueprintStructureResponse | null }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'MARK_DIRTY'; payload: string }
    | { type: 'MARK_CLEAN'; payload: string }
    | { type: 'REMOVE_FILE'; payload: string };

// === Initial State ===
const initialState: FileState = {
    activeFileId: null,
    activeFile: null,
    dirtyFiles: new Set(),
    fileCache: {},
    files: [],
    blueprintFiles: [],
    selectedFileId: null,
    isSaving: false,
};

// === Reducer ===
function fileReducer(state: FileState, action: FileAction): FileState {
    switch (action.type) {
        case 'SET_ACTIVE_FILE':
            return {
                ...state,
                activeFile: action.payload,
                activeFileId: action.payload?.id || null,
            };
        case 'SET_ACTIVE_FILE_ID':
            return { ...state, activeFileId: action.payload };
        case 'SET_SELECTED_FILE_ID':
            return { ...state, selectedFileId: action.payload };
        case 'UPDATE_ACTIVE_FILE_CONTENT':
            return {
                ...state,
                activeFile: state.activeFile ? {
                    ...state.activeFile,
                    content: action.payload,
                    status: state.activeFile.content !== action.payload ? 'dirty' : state.activeFile.status,
                } : null,
                dirtyFiles: state.activeFile && state.activeFile.content !== action.payload
                    ? new Set([...state.dirtyFiles, state.activeFile.id])
                    : state.dirtyFiles,
            };
        case 'SET_SAVE_STATUS':
            return {
                ...state,
                activeFile: state.activeFile ? {
                    ...state.activeFile,
                    status: action.payload,
                } : null,
            };
        case 'UPDATE_FILE_CACHE':
            return {
                ...state,
                fileCache: {
                    ...state.fileCache,
                    [action.payload.fileId]: {
                        content: action.payload.content,
                        timestamp: Date.now(),
                        fileType: action.payload.fileType,
                    },
                },
            };
        case 'SET_FILES':
            return { ...state, files: action.payload };
        case 'SET_BLUEPRINT_FILES':
            return { ...state, blueprintFiles: action.payload };
        case 'SET_BLUEPRINT_STRUCTURE':
            // Convert FileMetadata[] to FileListItem[] for compatibility
            const fileListItems: FileListItem[] = (action.payload?.files || []).map(f => ({
                file_id: f.file_id,
                filename: f.filename,
                file_type: f.file_type,
                size_bytes: f.size_bytes,
                created_at: f.updated_at,
                updated_at: f.updated_at,
            }));

            // Build blueprint files tree from structure
            const blueprintFiles: BlueprintFileItem[] = [
                {
                    id: 'root-spec',
                    name: action.payload?.blueprint.name || 'Blueprint',
                    type: 'folder',
                    children: (action.payload?.files || []).map(f => ({
                        id: f.file_id,
                        name: f.filename,
                        type: (f.file_type === 'md' ? 'md' : f.file_type === 'dfy' ? 'dfy' : 'unit') as BlueprintFileType,
                        file_id: f.file_id,
                    })),
                },
            ];

            return {
                ...state,
                files: fileListItems,
                blueprintFiles,
            };
        case 'SET_SAVING':
            return { ...state, isSaving: action.payload };
        case 'MARK_DIRTY':
            return {
                ...state,
                dirtyFiles: new Set([...state.dirtyFiles, action.payload]),
            };
        case 'MARK_CLEAN':
            const newDirtyFiles = new Set(state.dirtyFiles);
            newDirtyFiles.delete(action.payload);
            return {
                ...state,
                dirtyFiles: newDirtyFiles,
            };
        case 'REMOVE_FILE':
            const newCache = { ...state.fileCache };
            delete newCache[action.payload];
            const newDirtyFilesAfterRemove = new Set(state.dirtyFiles);
            newDirtyFilesAfterRemove.delete(action.payload);
            return {
                ...state,
                fileCache: newCache,
                dirtyFiles: newDirtyFilesAfterRemove,
                selectedFileId: state.selectedFileId === action.payload ? null : state.selectedFileId,
                activeFile: state.activeFile?.id === action.payload ? null : state.activeFile,
                activeFileId: state.activeFileId === action.payload ? null : state.activeFileId,
            };
        default:
            return state;
    }
}

// === Context Type ===
interface FileContextType {
    state: FileState;
    loadFile: (fileId: string) => Promise<void>;
    saveFile: (filename: string, content: string, fileType: 'md' | 'dfy' | 'unit') => Promise<void>;
    updateFile: (fileId: string, content: string, filename?: string) => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
    renameFile: (fileId: string, newName: string) => Promise<void>;
    createNewFile: (type: FileType, blueprintId: string) => Promise<void>;
    selectFile: (fileId: string | null) => Promise<void>;
    updateFileContent: (content: string) => void;
    forceSaveCurrentFile: () => Promise<void>;
    forceSave: (fileId: string) => Promise<void>;
}

// === Context ===
const FileContext = createContext<FileContextType | null>(null);

// === Provider ===
export function FileProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(fileReducer, initialState);
    const { state: blueprintState, loadBlueprintFromUrl } = useBlueprint();

    // Sync blueprint structure changes from BlueprintContext
    // Use a ref to track the last synced structure to prevent infinite loops
    const lastSyncedStructureRef = useRef<BlueprintStructureResponse | null>(null);
    React.useEffect(() => {
        if (blueprintState.blueprintStructure &&
            blueprintState.blueprintStructure !== lastSyncedStructureRef.current) {
            lastSyncedStructureRef.current = blueprintState.blueprintStructure;
            dispatch({ type: 'SET_BLUEPRINT_STRUCTURE', payload: blueprintState.blueprintStructure });
        }
    }, [blueprintState.blueprintStructure]);

    // Load file with caching (5 minute TTL)
    const loadFile = useCallback(async (fileId: string) => {
        // Check cache first
        const cached = state.fileCache[fileId];
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            // Use cached content
            const file = state.files.find(f => f.file_id === fileId) ||
                blueprintState.blueprintStructure?.files.find(f => f.file_id === fileId);

            if (file) {
                dispatch({
                    type: 'SET_ACTIVE_FILE',
                    payload: {
                        id: fileId,
                        content: cached.content,
                        syncedContent: cached.content,
                        status: 'clean',
                        lastSavedAt: new Date(file.updated_at),
                        filename: file.filename,
                        fileType: file.file_type as FileType,
                        blueprintId: blueprintState.blueprintId || '',
                    },
                });
                return;
            }
        }

        // Load from API
        try {
            const fileResponse = await apiClient.getFile(fileId);

            // Update cache
            dispatch({
                type: 'UPDATE_FILE_CACHE',
                payload: {
                    fileId,
                    content: fileResponse.content,
                    fileType: fileResponse.file_type,
                },
            });

            // Set active file
            dispatch({
                type: 'SET_ACTIVE_FILE',
                payload: {
                    id: fileId,
                    content: fileResponse.content,
                    syncedContent: fileResponse.content,
                    status: 'clean',
                    lastSavedAt: new Date(fileResponse.updated_at),
                    filename: fileResponse.filename,
                    fileType: fileResponse.file_type as FileType,
                    blueprintId: fileResponse.blueprint_id,
                },
            });
        } catch (error) {
            throw error;
        }
    }, [state.fileCache, state.files, blueprintState.blueprintStructure, blueprintState.blueprintId]);

    const saveFile = useCallback(async (
        filename: string,
        content: string,
        fileType: 'md' | 'dfy' | 'unit'
    ) => {
        if (!blueprintState.blueprintId) {
            throw new Error('No blueprint selected');
        }

        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

        try {
            const response = await apiClient.saveFile({
                filename,
                content,
                file_type: fileType,
                blueprint_id: blueprintState.blueprintId,
            });
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'clean' });
            dispatch({ type: 'MARK_CLEAN', payload: response.file_id });

            // Reload blueprint structure via BlueprintContext (which will sync to FileContext)
            if (blueprintState.blueprintId) {
                await loadBlueprintFromUrl(blueprintState.blueprintId, true);
            }
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [blueprintState.blueprintId]);

    const updateFile = useCallback(async (
        fileId: string,
        content: string,
        filename?: string
    ) => {
        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

        try {
            await apiClient.updateFile(fileId, content, filename);
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'clean' });
            dispatch({ type: 'MARK_CLEAN', payload: fileId });

            // Reload blueprint structure via BlueprintContext (which will sync to FileContext)
            if (blueprintState.blueprintId) {
                await loadBlueprintFromUrl(blueprintState.blueprintId, true);
            }
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [blueprintState.blueprintId]);

    // Force save current active file
    const forceSaveCurrentFile = useCallback(async () => {
        if (!state.activeFile) {
            return;
        }

        const { id, content } = state.activeFile;
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

        try {
            const response = await apiClient.updateFile(id, content);

            dispatch({
                type: 'SET_ACTIVE_FILE',
                payload: {
                    ...state.activeFile,
                    syncedContent: content,
                    status: 'clean',
                    lastSavedAt: new Date(response.updated_at),
                },
            });

            // Update cache
            dispatch({
                type: 'UPDATE_FILE_CACHE',
                payload: {
                    fileId: id,
                    content,
                    fileType: state.activeFile.fileType,
                },
            });

            dispatch({ type: 'MARK_CLEAN', payload: id });
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            throw error;
        }
    }, [state.activeFile]);

    const forceSave = useCallback(async (fileId: string) => {
        // Get current content based on selected file
        let content = '';
        if (state.selectedFileId === fileId && state.activeFile?.id === fileId) {
            content = state.activeFile.content;
        } else if (state.fileCache[fileId]) {
            content = state.fileCache[fileId].content;
        }

        if (content) {
            await updateFile(fileId, content);
        }
    }, [state.selectedFileId, state.activeFile, state.fileCache, updateFile]);

    // File switch guard - saves dirty files before switching
    const selectFile = useCallback(async (fileId: string | null) => {
        // If switching away from current file, check if it needs saving
        if (state.activeFile && state.activeFile.id !== fileId) {
            const currentFile = state.activeFile;

            // If dirty or saving, force save before switching
            if (currentFile.status === 'dirty' || currentFile.status === 'saving') {
                try {
                    await forceSaveCurrentFile();
                } catch (error) {
                    // Save failed - show toast but continue with switch
                    const { toast } = await import('sonner');
                    toast.error(`Failed to save ${currentFile.filename}`);
                }
            }
        }

        // Update selected file ID
        dispatch({ type: 'SET_SELECTED_FILE_ID', payload: fileId });

        // Load new file if provided
        if (fileId) {
            await loadFile(fileId);
        } else {
            // Clear active file
            dispatch({ type: 'SET_ACTIVE_FILE', payload: null });
        }
    }, [state.activeFile, loadFile, forceSaveCurrentFile]);

    // Update file content (triggers auto-save via hook)
    const updateFileContent = useCallback((content: string) => {
        if (state.activeFile) {
            dispatch({ type: 'UPDATE_ACTIVE_FILE_CONTENT', payload: content });
        }
    }, [state.activeFile]);

    // Delete file
    const deleteFile = useCallback(async (fileId: string) => {
        try {
            await apiClient.deleteFile(fileId);

            // Remove from cache and dirty set
            dispatch({ type: 'REMOVE_FILE', payload: fileId });

            // Reload blueprint structure via BlueprintContext (which will sync to FileContext via useEffect)
            if (blueprintState.blueprintId) {
                await loadBlueprintFromUrl(blueprintState.blueprintId, true);
            }
        } catch (error) {
            throw error;
        }
    }, [blueprintState.blueprintId, loadBlueprintFromUrl]);

    // Rename file
    const renameFile = useCallback(async (fileId: string, newName: string) => {
        // Find the file in files array or use activeFile
        const fileToRename = state.files.find(f => f.file_id === fileId) ||
            (state.activeFile && state.activeFile.id === fileId ? state.activeFile : null);

        if (!fileToRename) {
            throw new Error('File not found');
        }

        // Get current content
        let currentContent = '';
        if (state.activeFile && state.activeFile.id === fileId) {
            currentContent = state.activeFile.content;
        } else {
            // Load file content if not in activeFile
            try {
                const fileData = await apiClient.getFile(fileId);
                currentContent = fileData.content;
            } catch (error) {
                throw new Error('Failed to load file content for rename');
            }
        }

        // Validate filename
        const invalidChars = /[\/\\:*?"<>|]/;
        if (invalidChars.test(newName)) {
            throw new Error('Filename contains invalid characters');
        }

        try {
            const response = await apiClient.updateFile(fileId, currentContent, newName);

            // Update active file if it's the renamed file
            if (state.activeFile && state.activeFile.id === fileId) {
                dispatch({
                    type: 'SET_ACTIVE_FILE',
                    payload: {
                        ...state.activeFile,
                        filename: newName,
                    },
                });
            }

            // Reload blueprint structure via BlueprintContext (which will sync to FileContext via useEffect)
            if (blueprintState.blueprintId) {
                await loadBlueprintFromUrl(blueprintState.blueprintId, true);
            }
        } catch (error) {
            throw error;
        }
    }, [state.activeFile, state.files, blueprintState.blueprintId, loadBlueprintFromUrl]);

    // Create new file
    const createNewFile = useCallback(async (type: FileType, blueprintId: string) => {
        const timestamp = Date.now();
        const ext = type === 'md' ? 'md' : 'dfy';
        const defaultFilename = `untitled-${timestamp}.${ext}`;
        const emptyContent = '';

        try {
            const response = await apiClient.saveFile({
                filename: defaultFilename,
                content: emptyContent,
                file_type: type,
                blueprint_id: blueprintId,
            });

            // Reload blueprint structure via BlueprintContext (which will sync to FileContext via useEffect)
            await loadBlueprintFromUrl(blueprintId, true);

            // Select and load the new file
            await selectFile(response.file_id);
        } catch (error) {
            throw error;
        }
    }, [selectFile, loadBlueprintFromUrl]);

    const contextValue: FileContextType = {
        state,
        loadFile,
        saveFile,
        updateFile,
        deleteFile,
        renameFile,
        createNewFile,
        selectFile,
        updateFileContent,
        forceSaveCurrentFile,
        forceSave,
    };

    return (
        <FileContext.Provider value={contextValue}>
            {children}
        </FileContext.Provider>
    );
}

// === Hook ===
export function useFileContext(): FileContextType {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFileContext must be used within a FileProvider');
    }
    return context;
}
