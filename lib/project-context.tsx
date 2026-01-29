"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';
import type {
    ProjectResponse,
    ProjectStructureResponse,
    LogEntry,
    GenerateSpecResponse,
    Gap,
    Ambiguity,
    SpecStatistics,
    TraceabilityEntry,
    ReferenceMapping,
    ChatMessage,
    ChatContext,
    ChatResponse,
    DeconstructResponse,
} from './types';

// === State Types ===
export type ProjectMode = "local" | "cloud";

export interface ProjectState {
    // Project mode (local-first vs cloud-synced)
    mode: ProjectMode;

    // Project data
    projectId: string | null;
    currentProject: ProjectResponse | null;
    projectStructure: ProjectStructureResponse | null;
    hasProject: boolean;

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

    // Chat state
    chatHistory: ChatMessage[];

    // Log state
    logs: LogEntry[];

    // Loading states
    isLoading: boolean;
    isGenerating: boolean;
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
    | { type: 'SET_GENERATED_SPEC'; payload: GenerateSpecResponse }
    | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
    | { type: 'SET_CHAT_HISTORY'; payload: ChatMessage[] }
    | { type: 'ADD_LOG'; payload: LogEntry }
    | { type: 'CLEAR_LOGS' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_GENERATING'; payload: boolean }
    | { type: 'SET_DECONSTRUCTING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_HEALTH'; payload: { healthy: boolean; gemini: boolean; dafny: boolean } }
    | { type: 'SET_REFINED_SPEC'; payload: string | null }
    | { type: 'SET_REFINING'; payload: boolean }
    | { type: 'SET_GAPS'; payload: Gap[] }
    | { type: 'SET_AMBIGUITIES'; payload: Ambiguity[] }
    | { type: 'SET_STATISTICS'; payload: SpecStatistics | null }
    | { type: 'SET_TRACEABILITY_MATRIX'; payload: TraceabilityEntry[] }
    | { type: 'SET_REFERENCE_MAPPINGS'; payload: ReferenceMapping[] }
    | { type: 'RESET_PROJECT' };

// === Initial State ===
const initialState: ProjectState = {
    mode: "local",
    projectId: null,
    currentProject: null,
    projectStructure: null,
    hasProject: false,
    generatedSpec: null,
    traceabilityMatrix: [],
    referenceMappings: [],
    gaps: [],
    ambiguities: [],
    statistics: null,
    chatHistory: [],
    logs: [],
    isLoading: false,
    isGenerating: false,
    isDeconstructing: false,
    error: null,
    isBackendHealthy: false,
    geminiConfigured: false,
    dafnyAvailable: false,
    refinedSpec: null,
    isRefining: false,
};

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

function formatTime(): string {
    return new Date().toISOString().substr(11, 8);
}

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
            return {
                ...state,
                projectStructure: action.payload,
                currentProject: action.payload?.project || null,
                projectId: action.payload?.project.project_id || null,
                hasProject: action.payload !== null,
            };
        case 'SET_GENERATED_SPEC':
            return {
                ...state,
                generatedSpec: action.payload,
                traceabilityMatrix: action.payload.traceability_matrix,
                statistics: action.payload.statistics,
                gaps: [],
                ambiguities: [],
            };
        case 'SET_TRACEABILITY_MATRIX':
            return { ...state, traceabilityMatrix: action.payload };
        case 'SET_REFERENCE_MAPPINGS':
            return { ...state, referenceMappings: action.payload };
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
    // Generation and refinement
    generateSpec: (englishSpec: string, sourceFileId?: string, currentFilename?: string) => Promise<void>;
    findGaps: (spec: string, projectId?: string, sourceFileId?: string) => Promise<void>;
    refineSpec: (spec: string, gapIds?: string[]) => Promise<void>;
    // Chat
    sendChatMessage: (message: string, context?: ChatContext) => Promise<ChatResponse | null>;
    // Logs
    addLog: (level: LogEntry['level'], message: string) => void;
    clearLogs: () => void;
    // Utilities
    resetProject: () => void;
    setError: (error: string | null) => void;
    setDeconstructing: (value: boolean) => void;
    deconstructToUnits: (sourceFileId: string) => Promise<void>;
    hasUnits: (fileId: string) => Promise<boolean>;
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

            // Try to load traceability for the first markdown file
            const mdFile = structure.files.find(f => f.file_type === 'md');
            if (mdFile) {
                try {
                    const traceability = await apiClient.getTraceability(mdFile.file_id);
                    if (traceability.links && traceability.links.length > 0) {
                        // Convert traceability links to the format used by the UI
                        const entries: TraceabilityEntry[] = traceability.links.map(link => ({
                            id: link.unit_id,
                            source_text: link.title,
                            status: (link.status as TraceabilityEntry['status']) || 'mapped',
                            code_line: `lines ${link.source_range.start_line}-${link.source_range.end_line}`,
                            line_number: link.source_range.start_line,
                            confidence: 1.0, // Saved links have high confidence
                        }));
                        dispatch({ type: 'SET_TRACEABILITY_MATRIX', payload: entries });
                        addLog('info', `Loaded ${entries.length} traceability links`);
                    }
                } catch (traceError) {
                    // Traceability not available for this file - that's okay
                    addLog('debug', 'No saved traceability data found');
                }
            }

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

        // Reset state
        dispatch({ type: 'RESET_PROJECT' });

        // Navigate to new project
        router.push(`/app/${newProjectId}`);

        // Load new project
        await loadProjectFromUrl(newProjectId);
    }, [state.projectId, router, loadProjectFromUrl]);

    const generateSpec = useCallback(async (
        englishSpec: string,
        sourceFileId?: string,
        currentFilename?: string
    ) => {
        if (!state.projectId) {
            throw new Error('No project selected');
        }

        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            addLog('info', 'Starting specification generation...');
            addLog('debug', `Input length: ${englishSpec.length} characters`);

            const response = await apiClient.generateSpec(
                englishSpec,
                'standard',
                currentFilename,
                state.projectId,
                sourceFileId
            );

            dispatch({ type: 'SET_GENERATED_SPEC', payload: response });

            // Convert traceability to mappings
            const mappings = convertTraceabilityToMappings(
                response.traceability_matrix,
                response.dafny_skeleton
            );
            dispatch({ type: 'SET_REFERENCE_MAPPINGS', payload: mappings });

            // Refresh project structure to show newly created .dfy and unit files
            try {
                const structure = await apiClient.getProjectStructure(state.projectId);
                dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });
                addLog('debug', 'Project structure refreshed');
            } catch (refreshError) {
                // Don't fail the whole operation if refresh fails
                addLog('warn', 'Failed to refresh project structure');
            }

            addLog('success', `Triage: ${response.triage.doc_type} (${(response.triage.confidence * 100).toFixed(0)}% confidence)`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate specification';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
            throw error;
        } finally {
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    }, [addLog, state.projectId]);

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

    const refineSpec = useCallback(async (spec: string, gapIds?: string[]) => {
        if (!spec || state.gaps.length === 0) {
            throw new Error('No spec or gaps to refine');
        }

        dispatch({ type: 'SET_REFINING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            addLog('info', 'Refining specification...');

            const response = await apiClient.refineSpec({
                spec,
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
    }, [addLog, state.gaps]);

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

            // Reload project structure to show new units
            const structure = await apiClient.getProjectStructure(state.projectId);
            dispatch({ type: 'SET_PROJECT_STRUCTURE', payload: structure });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Deconstruction failed';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_DECONSTRUCTING', payload: false });
        }
    }, [state.projectId, addLog]);

    const contextValue: ProjectContextType = {
        state,
        setMode,
        checkHealth,
        createProject,
        loadProjectFromUrl,
        switchProject,
        generateSpec,
        findGaps,
        refineSpec,
        sendChatMessage,
        addLog,
        clearLogs,
        resetProject,
        setError,
        setDeconstructing,
        deconstructToUnits,
        hasUnits,
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
