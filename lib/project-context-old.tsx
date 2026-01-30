"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';
import type {
    GenerateSpecResponse,
    VerifyResponse,
    ChatResponse,
    ChatContext,
    ChatMessage,
    Gap,
    Ambiguity,
    TraceabilityEntry,
    ProofObligation,
    LogEntry,
    FileListItem,
    ProjectFileItem,
    ProjectFileType,
    ReferenceMapping,
    SpecStatistics,
    ProjectResponse,
    ProjectStructureResponse,
    ActiveFileState,
    FileCache,
    SaveStatus,
    FileType,
} from './types';

// === State Types ===
export type SaveState = "saved" | "dirty" | "saving" | "error";
export type ProjectMode = "local" | "cloud";

export interface ProjectState {
    // Project mode (local-first vs cloud-synced)
    mode: ProjectMode;
    
    // Project data
    projectId: string | null;
    currentProject: ProjectResponse | null;
    projectStructure: ProjectStructureResponse | null;
    hasProject: boolean;
    files: FileListItem[];
    projectFiles: ProjectFileItem[];
    selectedFileId: string | null;
    saveState: SaveState;
    
    // Active file state (FSM)
    activeFile: ActiveFileState | null;
    fileCache: FileCache;
    
    // File content cache
    markdownContent: string;
    dafnyCode: string;
    structuredSpec: string;
    
    // Generation results
    generatedSpec: GenerateSpecResponse | null;
    traceabilityMatrix: TraceabilityEntry[];
    referenceMappings: ReferenceMapping[];
    gaps: Gap[];
    ambiguities: Ambiguity[];
    statistics: SpecStatistics | null;
    
    // Refinement state
    refinedSpec: string | null;
    isRefining: boolean;
    
    // Verification results
    verificationResults: VerifyResponse | null;
    proofObligations: ProofObligation[];
    
    // Chat state
    chatHistory: ChatMessage[];
    
    // Log state
    logs: LogEntry[];
    
    // Loading states
    isLoading: boolean;
    isGenerating: boolean;
    isVerifying: boolean;
    isSaving: boolean;
    isDeconstructing: boolean;
    
    // Error state
    error: string | null;
    
    // Health check
    isBackendHealthy: boolean;
    geminiConfigured: boolean;
    dafnyAvailable: boolean;
}

// === Action Types ===
type ProjectAction =
    | { type: 'SET_MODE'; payload: ProjectMode }
    | { type: 'SET_PROJECT'; payload: { hasProject: boolean; projectId?: string } }
    | { type: 'SET_CURRENT_PROJECT'; payload: ProjectResponse | null }
    | { type: 'SET_PROJECT_STRUCTURE'; payload: ProjectStructureResponse | null }
    | { type: 'SET_FILES'; payload: FileListItem[] }
    | { type: 'SET_PROJECT_FILES'; payload: ProjectFileItem[] }
    | { type: 'SELECT_FILE'; payload: string | null }
    | { type: 'SET_ACTIVE_FILE'; payload: ActiveFileState | null }
    | { type: 'UPDATE_ACTIVE_FILE_CONTENT'; payload: string }
    | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
    | { type: 'UPDATE_FILE_CACHE'; payload: { fileId: string; content: string; fileType: string } }
    | { type: 'SET_MARKDOWN_CONTENT'; payload: string }
    | { type: 'SET_DAFNY_CODE'; payload: string }
    | { type: 'SET_STRUCTURED_SPEC'; payload: string }
    | { type: 'SET_GENERATED_SPEC'; payload: GenerateSpecResponse }
    | { type: 'SET_VERIFICATION_RESULTS'; payload: VerifyResponse }
    | { type: 'SET_PROOF_OBLIGATIONS'; payload: ProofObligation[] }
    | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
    | { type: 'SET_CHAT_HISTORY'; payload: ChatMessage[] }
    | { type: 'ADD_LOG'; payload: LogEntry }
    | { type: 'CLEAR_LOGS' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_GENERATING'; payload: boolean }
    | { type: 'SET_VERIFYING'; payload: boolean }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_SAVE_STATE'; payload: SaveState }
    | { type: 'SET_DECONSTRUCTING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_HEALTH'; payload: { healthy: boolean; gemini: boolean; dafny: boolean } }
    | { type: 'SET_REFINED_SPEC'; payload: string | null }
    | { type: 'SET_REFINING'; payload: boolean }
    | { type: 'SET_GAPS'; payload: Gap[] }
    | { type: 'SET_AMBIGUITIES'; payload: Ambiguity[] }
    | { type: 'SET_STATISTICS'; payload: SpecStatistics | null }
    | { type: 'RESET_PROJECT' };

// === Initial State ===
const initialState: ProjectState = {
    mode: "local", // Start with local mode by default
    projectId: null,
    currentProject: null,
    projectStructure: null,
    hasProject: false,
    files: [],
    projectFiles: [],
    selectedFileId: null,
    saveState: "saved",
    activeFile: null,
    fileCache: {},
    markdownContent: '',
    dafnyCode: '',
    structuredSpec: '',
    generatedSpec: null,
    traceabilityMatrix: [],
    referenceMappings: [],
    gaps: [],
    ambiguities: [],
    statistics: null,
    verificationResults: null,
    proofObligations: [],
    chatHistory: [],
    logs: [],
    isLoading: false,
    isGenerating: false,
    isVerifying: false,
    isSaving: false,
    isDeconstructing: false,
    error: null,
    isBackendHealthy: false,
    geminiConfigured: false,
    dafnyAvailable: false,
    refinedSpec: null,
    isRefining: false,
};

// === Reducer ===
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
    switch (action.type) {
        case 'SET_MODE':
            return { ...state, mode: action.payload };
        case 'SET_PROJECT':
            return {
                ...state,
                hasProject: action.payload.hasProject,
                projectId: action.payload.projectId || null,
            };
        case 'SET_CURRENT_PROJECT':
            return {
                ...state,
                currentProject: action.payload,
                projectId: action.payload?.project_id || null,
                hasProject: action.payload !== null,
            };
        case 'SET_PROJECT_STRUCTURE':
            // Convert FileMetadata[] to FileListItem[] for compatibility
            const fileListItems: FileListItem[] = (action.payload?.files || []).map(f => ({
                file_id: f.file_id,
                filename: f.filename,
                file_type: f.file_type,
                size_bytes: f.size_bytes,
                created_at: f.updated_at, // Use updated_at as fallback since FileMetadata doesn't have created_at
                updated_at: f.updated_at,
            }));
            return {
                ...state,
                projectStructure: action.payload,
                currentProject: action.payload?.project || null,
                projectId: action.payload?.project.project_id || null,
                hasProject: action.payload !== null,
                files: fileListItems,
            };
        case 'SET_FILES':
            return { ...state, files: action.payload };
        case 'SET_PROJECT_FILES':
            return { ...state, projectFiles: action.payload };
        case 'SELECT_FILE':
            return { ...state, selectedFileId: action.payload };
        case 'SET_ACTIVE_FILE':
            return { ...state, activeFile: action.payload };
        case 'UPDATE_ACTIVE_FILE_CONTENT':
            return {
                ...state,
                activeFile: state.activeFile ? {
                    ...state.activeFile,
                    content: action.payload,
                    status: state.activeFile.content !== action.payload ? 'dirty' : state.activeFile.status,
                } : null,
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
        case 'SET_MARKDOWN_CONTENT':
            return { 
                ...state, 
                markdownContent: action.payload,
                saveState: state.saveState === "saved" ? "dirty" : state.saveState
            };
        case 'SET_DAFNY_CODE':
            return { 
                ...state, 
                dafnyCode: action.payload,
                saveState: state.saveState === "saved" ? "dirty" : state.saveState
            };
        case 'SET_STRUCTURED_SPEC':
            return { ...state, structuredSpec: action.payload };
        case 'SET_GENERATED_SPEC':
            return {
                ...state,
                generatedSpec: action.payload,
                dafnyCode: action.payload.dafny_skeleton,
                structuredSpec: action.payload.structured_spec,
                // Gaps are no longer returned from generate_spec - use findGaps endpoint instead
                gaps: [],
                ambiguities: [],
                traceabilityMatrix: action.payload.traceability_matrix,
                statistics: action.payload.statistics,
                referenceMappings: convertTraceabilityToMappings(
                    action.payload.traceability_matrix,
                    action.payload.dafny_skeleton
                ),
            };
        case 'SET_VERIFICATION_RESULTS':
            return {
                ...state,
                verificationResults: action.payload,
                proofObligations: convertToProofObligations(action.payload),
            };
        case 'SET_PROOF_OBLIGATIONS':
            return { ...state, proofObligations: action.payload };
        case 'ADD_CHAT_MESSAGE':
            return { ...state, chatHistory: [...state.chatHistory, action.payload] };
        case 'SET_CHAT_HISTORY':
            return { ...state, chatHistory: action.payload };
        case 'ADD_LOG':
            return { ...state, logs: [...state.logs, action.payload] };
        case 'CLEAR_LOGS':
            return { ...state, logs: [] };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_GENERATING':
            return { ...state, isGenerating: action.payload };
        case 'SET_VERIFYING':
            return { ...state, isVerifying: action.payload };
        case 'SET_SAVING':
            return { ...state, isSaving: action.payload };
        case 'SET_SAVE_STATE':
            return { ...state, saveState: action.payload };
        case 'SET_DECONSTRUCTING':
            return { ...state, isDeconstructing: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_HEALTH':
            return {
                ...state,
                isBackendHealthy: action.payload.healthy,
                geminiConfigured: action.payload.gemini,
                dafnyAvailable: action.payload.dafny,
            };
        case 'SET_REFINED_SPEC':
            return { ...state, refinedSpec: action.payload };
        case 'SET_REFINING':
            return { ...state, isRefining: action.payload };
        case 'SET_GAPS':
            return { ...state, gaps: action.payload };
        case 'SET_AMBIGUITIES':
            return { ...state, ambiguities: action.payload };
        case 'SET_STATISTICS':
            return { ...state, statistics: action.payload };
        case 'RESET_PROJECT':
            return { ...initialState };
        default:
            return state;
    }
}

// === Helper Functions ===
function convertTraceabilityToMappings(
    entries: TraceabilityEntry[],
    dafnyCode: string
): ReferenceMapping[] {
    const lines = dafnyCode.split('\n');
    
    return entries.map((entry) => {
        const lineNum = entry.line_number || 1;
        const startLine = Math.max(1, lineNum - 2);
        const endLine = Math.min(lines.length, lineNum + 5);
        const codeSnippet = lines.slice(startLine - 1, endLine).join('\n');
        
        return {
            id: entry.id,
            markdownText: entry.source_text,
            dafnyLines: { start: startLine, end: endLine },
            dafnyCode: codeSnippet,
        };
    });
}

function convertToProofObligations(response: VerifyResponse): ProofObligation[] {
    const obligations: ProofObligation[] = [];
    
    for (const result of response.results) {
        obligations.push({
            id: `${result.type}-${result.name}`,
            name: result.name,
            location: result.location.file || 'unknown',
            status: result.status === 'verified' ? 'verified' : 
                   result.status === 'failed' ? 'failed' : 
                   result.status === 'timeout' ? 'warning' : 'pending',
            time: `${response.verification_time_ms}ms`,
            details: result.message,
        });
        
        // Add nested proof obligations
        for (const po of result.proof_obligations) {
            obligations.push({
                id: po.id,
                name: po.description,
                location: `${result.name}`,
                status: po.status === 'proven' ? 'verified' : 'failed',
                details: po.counterexample,
            });
        }
    }
    
    return obligations;
}

function formatTime(): string {
    return new Date().toISOString().substr(11, 8);
}

// === Context Type ===
interface ProjectContextType {
    state: ProjectState;
    // Mode management
    setMode: (mode: ProjectMode) => void;
    // Actions
    checkHealth: () => Promise<void>;
    createProject: (name: string, description?: string) => Promise<void>;
    loadProjectFromUrl: (projectId: string) => Promise<void>;
    switchProject: (newProjectId: string) => Promise<void>;
    loadFiles: () => Promise<void>;
    loadFile: (fileId: string) => Promise<void>;
    saveFile: (filename: string, content: string, fileType: 'md' | 'dfy' | 'unit') => Promise<void>;
    updateFile: (fileId: string, content: string, filename?: string) => Promise<void>;
    updateFileContent: (content: string) => void;
    forceSaveCurrentFile: () => Promise<void>;
    deleteFile: (fileId: string) => Promise<void>;
    renameFile: (fileId: string, newName: string) => Promise<void>;
    hasUnits: (fileId: string) => Promise<boolean>;
    createNewFile: (type: FileType, projectId: string) => Promise<void>;
    forceSave: (fileId: string) => Promise<void>;
    selectFile: (fileId: string | null) => Promise<void>;
    setMarkdownContent: (content: string) => void;
    setDafnyCode: (code: string) => void;
    generateSpec: (englishSpec: string) => Promise<void>;
    findGaps: (spec: string, projectId?: string, sourceFileId?: string) => Promise<void>;
    refineSpec: (gapIds?: string[]) => Promise<void>;
    applyRefinement: () => Promise<void>;
    runVerification: (dafnyCode: string) => Promise<void>;
    sendChatMessage: (message: string, context?: ChatContext) => Promise<ChatResponse | null>;
    addLog: (level: LogEntry['level'], message: string) => void;
    clearLogs: () => void;
    resetProject: () => void;
    setError: (error: string | null) => void;
    setDeconstructing: (value: boolean) => void;
    deconstructToUnits: (sourceFileId: string) => Promise<void>;
}

// === Context ===
const ProjectContext = createContext<ProjectContextType | null>(null);

// === Provider ===
export function ProjectProvider({ 
    children,
    initialMode = "local"
}: { 
    children: ReactNode;
    initialMode?: ProjectMode;
}) {
    const [state, dispatch] = useReducer(projectReducer, {
        ...initialState,
        mode: initialMode,
    });
    const router = useRouter();

    const setMode = useCallback((mode: ProjectMode) => {
        dispatch({ type: 'SET_MODE', payload: mode });
    }, []);

    const addLog = useCallback((level: LogEntry['level'], message: string) => {
        dispatch({
            type: 'ADD_LOG',
            payload: { time: formatTime(), level, message },
        });
    }, []);

    const checkHealth = useCallback(async () => {
        try {
            const health = await apiClient.checkHealth();
            dispatch({
                type: 'SET_HEALTH',
                payload: {
                    healthy: health.status === 'ok',
                    gemini: health.gemini_configured,
                    dafny: health.dafny_available,
                },
            });
            addLog('success', `Backend connected: Gemini ${health.gemini_configured ? '✓' : '✗'}, Dafny ${health.dafny_available ? '✓' : '✗'}`);
        } catch (error) {
            dispatch({
                type: 'SET_HEALTH',
                payload: { healthy: false, gemini: false, dafny: false },
            });
            addLog('error', `Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [addLog]);

    const createProject = useCallback(async (name: string, description?: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', `Creating new project: ${name}...`);
            
            // Create project via API (bootstraps README.md)
            const project = await apiClient.createProject(name, description);
            
            dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
            
            // Load project structure
            const structure = await apiClient.getProjectStructure(project.project_id);
            dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
            
            // Navigate to project URL
            if (project.redirect_url) {
                router.push(project.redirect_url);
            }
            
            addLog('success', `Project created: ${project.name} (${project.file_count} files)`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create project';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [addLog, router]);
    
    const loadProjectFromUrl = useCallback(async (projectId: string) => {
        if (state.projectId === projectId && state.currentProject) {
            return; // Already loaded
        }
        
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', `Loading project: ${projectId}...`);
            
            const structure = await apiClient.getProjectStructure(projectId);
            dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
            
            // Convert FileMetadata[] to FileListItem[] for compatibility
            const fileListItems: FileListItem[] = structure.files.map(f => ({
                file_id: f.file_id,
                filename: f.filename,
                file_type: f.file_type,
                size_bytes: f.size_bytes,
                created_at: f.updated_at, // Use updated_at as fallback
                updated_at: f.updated_at,
            }));
            dispatch({ type: 'SET_FILES', payload: fileListItems });
            
            // Build project files tree from structure
            const projectFiles: ProjectFileItem[] = [
                {
                    id: 'root-spec',
                    name: structure.project.name,
                    type: 'folder',
                    children: structure.files.map(f => ({
                        id: f.file_id,
                        name: f.filename,
                        type: (f.file_type === 'md' ? 'md' : f.file_type === 'dfy' ? 'dfy' : 'unit') as ProjectFileType,
                        file_id: f.file_id,
                    })),
                },
            ];
            dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            
            addLog('success', `Project loaded: ${structure.project.name} (${structure.files.length} files)`);
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to load project';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
            
            // Redirect to app on 404/403
            if (error.status === 404 || error.status === 403) {
                router.push('/app');
            }
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.projectId, state.currentProject, addLog, router]);
    
    const switchProject = useCallback(async (newProjectId: string) => {
        if (state.projectId === newProjectId) {
            return; // Already on this project
        }
        
        // Save current file if dirty
        if (state.selectedFileId && state.saveState === "dirty") {
            try {
                await forceSave(state.selectedFileId);
            } catch (error) {
                addLog('warn', 'Failed to save before switching projects');
            }
        }
        
        // Reset state
        dispatch({ type: 'RESET_PROJECT' });
        
        // Navigate to new project
        router.push(`/app/${newProjectId}`);
        
        // Load new project
        await loadProjectFromUrl(newProjectId);
    }, [state.projectId, state.selectedFileId, state.saveState, router, loadProjectFromUrl, addLog]);

    const loadFiles = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
            const response = await apiClient.listFiles();
            dispatch({ type: 'SET_FILES', payload: response.files });
            addLog('info', `Loaded ${response.total} files`);
        } catch (error) {
            addLog('error', `Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [addLog]);

    const saveFile = useCallback(async (
        filename: string,
        content: string,
        fileType: 'md' | 'dfy' | 'unit'
    ) => {
        if (!state.projectId) {
            throw new Error('No project selected');
        }
        
        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'SET_SAVE_STATE', payload: 'saving' });
        
        try {
            const response = await apiClient.saveFile({
                filename,
                content,
                file_type: fileType,
                project_id: state.projectId,
            });
            dispatch({ type: 'SET_SAVE_STATE', payload: 'saved' });
            addLog('success', `Saved ${response.filename}`);
            
            // Reload project structure to get updated file list
            if (state.projectId) {
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
            }
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATE', payload: 'error' });
            addLog('error', `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [addLog, state.projectId]);
    
    const updateFile = useCallback(async (
        fileId: string,
        content: string,
        filename?: string
    ) => {
        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'SET_SAVE_STATE', payload: 'saving' });
        
        try {
            await apiClient.updateFile(fileId, content, filename);
            dispatch({ type: 'SET_SAVE_STATE', payload: 'saved' });
            addLog('success', `Updated ${filename || fileId}`);
            
            // Reload project structure
            if (state.projectId) {
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
            }
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATE', payload: 'error' });
            addLog('error', `Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [addLog, state.projectId]);
    
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
            
            addLog('success', `Saved ${state.activeFile.filename}`);
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            addLog('error', `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }, [state.activeFile, addLog]);
    
    const forceSave = useCallback(async (fileId: string) => {
        // Get current content based on selected file
        let content = '';
        if (state.selectedFileId === fileId) {
            // Determine content based on file type
            const file = state.files.find(f => f.file_id === fileId);
            if (file?.file_type === 'md') {
                content = state.markdownContent;
            } else if (file?.file_type === 'dfy') {
                content = state.dafnyCode;
            }
        }
        
        if (content) {
            await updateFile(fileId, content);
        }
    }, [state.selectedFileId, state.files, state.markdownContent, state.dafnyCode, updateFile]);

    // Load file with caching (5 minute TTL)
    const loadFile = useCallback(async (fileId: string) => {
        // Check cache first
        const cached = state.fileCache[fileId];
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            // Use cached content
            const file = state.files.find(f => f.file_id === fileId) || 
                        state.projectStructure?.files.find(f => f.file_id === fileId);
            
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
                        projectId: state.projectId || '',
                    },
                });
                
                // Update editor content based on file type
                if (file.file_type === 'md') {
                    dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: cached.content });
                } else if (file.file_type === 'dfy') {
                    dispatch({ type: 'SET_DAFNY_CODE', payload: cached.content });
                }
                
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
                    projectId: fileResponse.project_id,
                },
            });
            
            // Update editor content based on file type
            if (fileResponse.file_type === 'md') {
                dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: fileResponse.content });
            } else if (fileResponse.file_type === 'dfy') {
                dispatch({ type: 'SET_DAFNY_CODE', payload: fileResponse.content });
            }
            
            addLog('success', `Loaded ${fileResponse.filename}`);
        } catch (error) {
            addLog('error', `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }, [state.fileCache, state.files, state.projectStructure, state.projectId, addLog]);

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
        dispatch({ type: 'SELECT_FILE', payload: fileId });
        
        // Load new file if provided
        if (fileId) {
            await loadFile(fileId);
        } else {
            // Clear active file
            dispatch({ type: 'SET_ACTIVE_FILE', payload: null });
        }
    }, [state.activeFile, loadFile]);

    // Update file content (triggers auto-save via hook)
    const updateFileContent = useCallback((content: string) => {
        if (state.activeFile) {
            dispatch({ type: 'UPDATE_ACTIVE_FILE_CONTENT', payload: content });
            
            // Also update editor content based on file type
            if (state.activeFile.fileType === 'md') {
                dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: content });
            } else if (state.activeFile.fileType === 'dfy') {
                dispatch({ type: 'SET_DAFNY_CODE', payload: content });
            }
        }
    }, [state.activeFile]);

    // Delete file
    const deleteFile = useCallback(async (fileId: string) => {
        try {
            await apiClient.deleteFile(fileId);
            
            // Remove from cache
            const newCache = { ...state.fileCache };
            delete newCache[fileId];
            dispatch({ type: 'UPDATE_FILE_CACHE', payload: { fileId: '', content: '', fileType: '' } }); // Trigger cache update
            
            // Clear selection if deleted file was selected
            if (state.selectedFileId === fileId) {
                dispatch({ type: 'SELECT_FILE', payload: null });
                dispatch({ type: 'SET_ACTIVE_FILE', payload: null });
            }
            
            // Reload project structure and rebuild tree
            if (state.projectId) {
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
                
                // Rebuild project files tree
                const projectFiles: ProjectFileItem[] = [
                    {
                        id: 'root-spec',
                        name: structure.project.name,
                        type: 'folder',
                        children: structure.files.map(f => ({
                            id: f.file_id,
                            name: f.filename,
                            type: f.file_type as ProjectFileType,
                            file_id: f.file_id,
                        })),
                    },
                ];
                dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            }
            
            addLog('success', 'File deleted');
        } catch (error) {
            addLog('error', `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }, [state.fileCache, state.selectedFileId, state.projectId, addLog]);

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
            
            // Reload project structure and rebuild tree
            if (state.projectId) {
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
                
                // Rebuild project files tree
                const projectFiles: ProjectFileItem[] = [
                    {
                        id: 'root-spec',
                        name: structure.project.name,
                        type: 'folder',
                        children: structure.files.map(f => ({
                            id: f.file_id,
                            name: f.filename,
                            type: f.file_type as ProjectFileType,
                            file_id: f.file_id,
                        })),
                    },
                ];
                dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            }
            
            addLog('success', `Renamed to ${newName}`);
        } catch (error) {
            addLog('error', `Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }, [state.activeFile, state.projectId, addLog]);

    // Create new file
    const createNewFile = useCallback(async (type: FileType, projectId: string) => {
        const timestamp = Date.now();
        const ext = type === 'md' ? 'md' : 'dfy';
        const defaultFilename = `untitled-${timestamp}.${ext}`;
        const emptyContent = '';
        
        try {
            const response = await apiClient.saveFile({
                filename: defaultFilename,
                content: emptyContent,
                file_type: type,
                project_id: projectId,
            });
            
            // Reload project structure
            const structure = await apiClient.getProjectStructure(projectId);
            dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
            
            // Rebuild project files tree from updated structure
            const projectFiles: ProjectFileItem[] = [
                {
                    id: 'root-spec',
                    name: structure.project.name,
                    type: 'folder',
                    children: structure.files.map(f => ({
                        id: f.file_id,
                        name: f.filename,
                        type: f.file_type as ProjectFileType,
                        file_id: f.file_id,
                    })),
                },
            ];
            dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            
            // Select and load the new file
            await selectFile(response.file_id);
            
            addLog('success', `Created ${defaultFilename}`);
        } catch (error) {
            addLog('error', `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }, [selectFile, addLog]);

    const setMarkdownContent = useCallback((content: string) => {
        dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: content });
    }, []);

    const setDafnyCode = useCallback((code: string) => {
        dispatch({ type: 'SET_DAFNY_CODE', payload: code });
    }, []);

    const generateSpec = useCallback(async (englishSpec: string) => {
        if (!state.projectId) {
            throw new Error('No project selected');
        }
        
        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Starting specification generation...');
            addLog('debug', `Input length: ${englishSpec.length} characters`);
            
            // Get current filename and file ID
            const currentFilename = state.activeFile?.filename || state.files.find(f => f.file_id === state.selectedFileId)?.filename;
            // Use file_id from activeFile.id or selectedFileId
            const sourceFileId = state.activeFile?.id || state.selectedFileId || undefined;
            
            const response = await apiClient.generateSpec(
                englishSpec,
                'standard',
                currentFilename,
                state.projectId,
                sourceFileId
            );
            
            dispatch({ type: 'SET_GENERATED_SPEC', payload: response });
            
            addLog('success', `Triage: ${response.triage.doc_type} (${(response.triage.confidence * 100).toFixed(0)}% confidence)`);
            
            // Handle filename suggestion (only if file hasn't been manually renamed)
            if (response.suggested_filename && sourceFileId) {
                // Check if file was already renamed
                try {
                    const fileData = await apiClient.getFile(sourceFileId);
                    if (!fileData.renamed) {
                        addLog('info', `Suggested filename: ${response.suggested_filename}.md`);
                        // Auto-rename the file
                        try {
                            await renameFile(sourceFileId, `${response.suggested_filename}.md`);
                            addLog('success', `Renamed to ${response.suggested_filename}.md`);
                        } catch (error) {
                            addLog('warn', `Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    } else {
                        addLog('info', `Skipping auto-rename: file was manually renamed`);
                    }
                } catch (error) {
                    addLog('warn', `Could not check rename status: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            
            // Handle units creation
            if (response.units_created && response.units_created.length > 0) {
                addLog('success', `Created ${response.units_created.length} units in ${response.subfolder_name || 'subfolder'}`);
                addLog('success', `Traceability: ${response.statistics.coverage_percentage.toFixed(0)}% coverage (${response.statistics.mapped_requirements}/${response.statistics.total_requirements} requirements mapped)`);
                
                // Reload project structure to show new units
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
                
                // Rebuild project files tree
                const projectFiles: ProjectFileItem[] = [
                    {
                        id: 'root-spec',
                        name: structure.project.name,
                        type: 'folder',
                        children: structure.files.map(f => ({
                            id: f.file_id,
                            name: f.filename,
                            type: f.file_type as ProjectFileType,
                            file_id: f.file_id,
                        })),
                    },
                ];
                dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            } else {
                // Fallback: no units created, show standard response
                if (response.dafny_skeleton) {
                    addLog('info', `Generated ${response.dafny_skeleton.split('\n').length} lines of Dafny`);
                }
                if (response.statistics.total_requirements > 0) {
                    addLog('success', `Traceability: ${response.statistics.coverage_percentage.toFixed(0)}% coverage (${response.statistics.mapped_requirements}/${response.statistics.total_requirements} requirements mapped)`);
                }
                
                // Only save root Dafny if no units were created
                if (response.dafny_skeleton) {
                    try {
                        await apiClient.saveFile({
                            filename: 'spec.dfy',
                            content: response.dafny_skeleton,
                            file_type: 'dfy',
                            project_id: state.projectId,
                        });
                        addLog('success', 'Saved spec.dfy');
                        
                        // Reload project structure
                        const structure = await apiClient.getProjectStructure(state.projectId);
                        dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
                        
                        // Rebuild project files tree
                        const projectFiles: ProjectFileItem[] = [
                            {
                                id: 'root-spec',
                                name: structure.project.name,
                                type: 'folder',
                                children: structure.files.map(f => ({
                                    id: f.file_id,
                                    name: f.filename,
                                    type: f.file_type as ProjectFileType,
                                    file_id: f.file_id,
                                })),
                            },
                        ];
                        dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
                    } catch (error) {
                        addLog('warn', 'Failed to save spec.dfy (file may already exist)');
                    }
                }
            }
            
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate specification';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    }, [addLog, state.projectId, state.activeFile, state.files, state.selectedFileId, renameFile]);

    const findGaps = useCallback(async (spec: string, projectId?: string, sourceFileId?: string) => {
        dispatch({ type: 'SET_REFINING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Finding gaps in specification...');
            
            const response = await apiClient.findGaps({
                spec,
                project_id: projectId,
                source_file_id: sourceFileId,
            });
            
            // Update gaps, ambiguities, and statistics directly
            dispatch({ type: 'SET_GAPS', payload: response.gaps });
            dispatch({ type: 'SET_AMBIGUITIES', payload: response.ambiguities });
            dispatch({ type: 'SET_STATISTICS', payload: response.statistics });
            
            addLog('success', `Found ${response.gaps.length} gaps, ${response.ambiguities.length} ambiguities`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to find gaps';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
            throw error;
        } finally {
            dispatch({ type: 'SET_REFINING', payload: false });
        }
    }, [addLog]);

    const refineSpec = useCallback(async (gapIds?: string[]) => {
        if (!state.markdownContent || state.gaps.length === 0) {
            throw new Error('No spec or gaps to refine');
        }
        
        dispatch({ type: 'SET_REFINING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Refining specification...');
            
            const response = await apiClient.refineSpec({
                spec: state.markdownContent,
                gaps: state.gaps,
                apply_gap_ids: gapIds,
            });
            
            dispatch({ type: 'SET_REFINED_SPEC', payload: response.refined_spec });
            addLog('success', `Applied ${response.applied_gaps.length} gap suggestions`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to refine specification';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
            throw error;
        } finally {
            dispatch({ type: 'SET_REFINING', payload: false });
        }
    }, [addLog, state.markdownContent, state.gaps]);

    const applyRefinement = useCallback(async () => {
        if (!state.refinedSpec || !state.activeFile) {
            throw new Error('No refined spec to apply');
        }
        
        dispatch({ type: 'SET_SAVING', payload: true });
        dispatch({ type: 'SET_SAVE_STATE', payload: 'saving' });
        
        try {
            // Update the markdown file with refined content
            const response = await apiClient.updateFile(state.activeFile.id, state.refinedSpec);
            
            // Update active file content immediately
            dispatch({
                type: 'SET_ACTIVE_FILE',
                payload: {
                    ...state.activeFile,
                    content: state.refinedSpec,
                    syncedContent: state.refinedSpec,
                    status: 'clean',
                    lastSavedAt: new Date(response.updated_at),
                },
            });
            
            // Update state
            dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: state.refinedSpec });
            dispatch({ type: 'SET_REFINED_SPEC', payload: null });
            dispatch({ type: 'SET_SAVE_STATE', payload: 'saved' });
            
            addLog('success', 'Refinement applied to specification');
        } catch (error) {
            dispatch({ type: 'SET_SAVE_STATE', payload: 'error' });
            const message = error instanceof Error ? error.message : 'Failed to apply refinement';
            addLog('error', message);
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [addLog, state.refinedSpec, state.activeFile]);

    const runVerification = useCallback(async (dafnyCode: string) => {
        dispatch({ type: 'SET_VERIFYING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Starting Dafny verification...');
            
            const response = await apiClient.verifyDafny({
                dafny_code: dafnyCode,
                timeout_seconds: 30,
                solver: 'z3',
            });
            
            dispatch({ type: 'SET_VERIFICATION_RESULTS', payload: response });
            
            // Update verification status in project files tree
            if (state.projectId && state.selectedFileId) {
                const updatedProjectFiles = [...state.projectFiles];
                const updateFileStatus = (items: ProjectFileItem[]) => {
                    for (const item of items) {
                        if (item.file_id === state.selectedFileId) {
                            item.verificationStatus = response.verified ? 'verified' : 'failed';
                        }
                        if (item.children) {
                            updateFileStatus(item.children);
                        }
                    }
                };
                updateFileStatus(updatedProjectFiles);
                dispatch({ type: 'SET_PROJECT_FILES', payload: updatedProjectFiles });
            }
            
            if (response.verified) {
                addLog('success', `Verification passed in ${response.verification_time_ms}ms`);
            } else {
                addLog('error', `Verification failed: ${response.errors.length} errors`);
                for (const err of response.errors) {
                    addLog('error', `Line ${err.line}: ${err.message}`);
                }
            }
            
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Verification failed';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_VERIFYING', payload: false });
        }
    }, [addLog]);

    const sendChatMessage = useCallback(async (
        message: string,
        context?: ChatContext
    ): Promise<ChatResponse | null> => {
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', content: message } });
        
        try {
            const response = await apiClient.chatWithAssistant(message, context, state.chatHistory);
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: response.content } });
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Chat failed';
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: `Error: ${errorMessage}` } });
            addLog('error', `Chat error: ${errorMessage}`);
            return null;
        }
    }, [state.chatHistory, addLog]);

    const clearLogs = useCallback(() => {
        dispatch({ type: 'CLEAR_LOGS' });
    }, []);

    const resetProject = useCallback(() => {
        dispatch({ type: 'RESET_PROJECT' });
    }, []);

    const setError = useCallback((error: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    }, []);

    const setDeconstructing = useCallback((value: boolean) => {
        dispatch({ type: 'SET_DECONSTRUCTING', payload: value });
    }, []);

    // Helper function to check if file has units
    const hasUnits = useCallback(async (fileId: string): Promise<boolean> => {
        try {
            const traceability = await apiClient.getTraceability(fileId);
            return traceability.links && traceability.links.length > 0;
        } catch (error) {
            // If traceability endpoint fails, assume no units
            return false;
        }
    }, []);

    const deconstructToUnits = useCallback(async (sourceFileId: string) => {
        dispatch({ type: 'SET_DECONSTRUCTING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            if (!state.projectId) {
                throw new Error('No project selected');
            }
            
            addLog('info', 'Starting specification deconstruction...');
            
            const response = await apiClient.deconstructSpec({
                project_id: state.projectId,
                source_file_id: sourceFileId,
                strategy: 'auto'
            });
            
            // Log results
            addLog('success', `Deconstruction complete: ${response.statistics.successful_units} units created`);
            
            if (response.statistics.failed_units > 0) {
                addLog('warn', `${response.statistics.failed_units} units failed`);
            }
            
            if (response.errors.length > 0) {
                response.errors.forEach(error => addLog('error', error));
            }
            
            addLog('info', `Created ${response.statistics.total_files_created} files in ${response.statistics.processing_time_seconds}s`);
            
            // Refresh file list to show new units
            await loadFiles();
            
            // Update project files tree with units
            const unitFiles: ProjectFileItem[] = response.units.map(unit => ({
                id: unit.unit_id,
                name: unit.unit_filename,
                type: 'unit' as const,
                file_id: unit.unit_id,
                children: [
                    {
                        id: `${unit.unit_id}-dfy`,
                        name: unit.dafny_filename,
                        type: 'dfy' as const,
                        file_id: response.links.find(l => l.unit_file_id === unit.unit_id)?.dafny_file_id,
                        verificationStatus: 'pending' as const
                    }
                ]
            }));
            
            // Add units to project structure
            const updatedProjectFiles = [...state.projectFiles];
            const rootSpec = updatedProjectFiles.find(f => f.id === 'root-spec');
            if (rootSpec && rootSpec.children) {
                // Add Units folder if it doesn't exist
                let unitsFolder = rootSpec.children.find(c => c.name === 'Units');
                if (!unitsFolder) {
                    unitsFolder = {
                        id: 'units-folder',
                        name: 'Units',
                        type: 'folder' as const,
                        children: []
                    };
                    rootSpec.children.push(unitsFolder);
                }
                
                // Add unit files to Units folder
                if (unitsFolder.children) {
                    unitsFolder.children.push(...unitFiles);
                }
            }
            
            dispatch({ type: 'SET_PROJECT_FILES', payload: updatedProjectFiles });
            
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Deconstruction failed';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_DECONSTRUCTING', payload: false });
        }
    }, [state.projectId, state.projectFiles, addLog, loadFiles]);

    const contextValue: ProjectContextType = {
        state,
        setMode,
        checkHealth,
        createProject,
        loadProjectFromUrl,
        switchProject,
        loadFiles,
        loadFile,
        saveFile,
        updateFile,
        updateFileContent,
        forceSaveCurrentFile,
        deleteFile,
        renameFile,
        hasUnits,
        createNewFile,
        forceSave,
        selectFile,
        setMarkdownContent,
        setDafnyCode,
        generateSpec,
        findGaps,
        refineSpec,
        applyRefinement,
        runVerification,
        sendChatMessage,
        addLog,
        clearLogs,
        resetProject,
        setError,
        setDeconstructing,
        deconstructToUnits,
    };

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
}

// === Hook ===
export function useProject(): ProjectContextType {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}

export default ProjectContext;
