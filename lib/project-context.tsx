"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
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
    ReferenceMapping,
    SpecStatistics,
} from './types';

// === State Types ===
export interface ProjectState {
    // Project data
    projectId: string | null;
    hasProject: boolean;
    files: FileListItem[];
    projectFiles: ProjectFileItem[];
    selectedFileId: string | null;
    
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
    | { type: 'SET_PROJECT'; payload: { hasProject: boolean; projectId?: string } }
    | { type: 'SET_FILES'; payload: FileListItem[] }
    | { type: 'SET_PROJECT_FILES'; payload: ProjectFileItem[] }
    | { type: 'SELECT_FILE'; payload: string | null }
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
    | { type: 'SET_DECONSTRUCTING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_HEALTH'; payload: { healthy: boolean; gemini: boolean; dafny: boolean } }
    | { type: 'RESET_PROJECT' };

// === Initial State ===
const initialState: ProjectState = {
    projectId: null,
    hasProject: false,
    files: [],
    projectFiles: [],
    selectedFileId: null,
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
};

// === Reducer ===
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
    switch (action.type) {
        case 'SET_PROJECT':
            return {
                ...state,
                hasProject: action.payload.hasProject,
                projectId: action.payload.projectId || null,
            };
        case 'SET_FILES':
            return { ...state, files: action.payload };
        case 'SET_PROJECT_FILES':
            return { ...state, projectFiles: action.payload };
        case 'SELECT_FILE':
            return { ...state, selectedFileId: action.payload };
        case 'SET_MARKDOWN_CONTENT':
            return { ...state, markdownContent: action.payload };
        case 'SET_DAFNY_CODE':
            return { ...state, dafnyCode: action.payload };
        case 'SET_STRUCTURED_SPEC':
            return { ...state, structuredSpec: action.payload };
        case 'SET_GENERATED_SPEC':
            return {
                ...state,
                generatedSpec: action.payload,
                dafnyCode: action.payload.dafny_skeleton,
                structuredSpec: action.payload.structured_spec,
                gaps: action.payload.gaps,
                ambiguities: action.payload.ambiguities,
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
    // Actions
    checkHealth: () => Promise<void>;
    createProject: (markdownContent: string) => Promise<void>;
    loadFiles: () => Promise<void>;
    saveFile: (filename: string, content: string, fileType: 'markdown' | 'dafny') => Promise<void>;
    selectFile: (fileId: string | null) => void;
    setMarkdownContent: (content: string) => void;
    setDafnyCode: (code: string) => void;
    generateSpec: (englishSpec: string) => Promise<void>;
    runVerification: (dafnyCode: string) => Promise<void>;
    sendChatMessage: (message: string, context?: ChatContext) => Promise<ChatResponse | null>;
    addLog: (level: LogEntry['level'], message: string) => void;
    clearLogs: () => void;
    resetProject: () => void;
    setError: (error: string | null) => void;
    setDeconstructing: (value: boolean) => void;
}

// === Context ===
const ProjectContext = createContext<ProjectContextType | null>(null);

// === Provider ===
export function ProjectProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(projectReducer, initialState);

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

    const createProject = useCallback(async (markdownContent: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Creating new project...');
            
            // Save the initial markdown file
            const response = await apiClient.saveFile({
                filename: 'requirements.md',
                content: markdownContent,
                file_type: 'markdown',
            });
            
            dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: markdownContent });
            dispatch({ type: 'SET_PROJECT', payload: { hasProject: true, projectId: response.file_id } });
            dispatch({ type: 'SELECT_FILE', payload: 'requirements.md' });
            
            // Build initial project structure
            const projectFiles: ProjectFileItem[] = [
                {
                    id: 'root-spec',
                    name: 'Root Spec (Project)',
                    type: 'folder',
                    children: [
                        {
                            id: 'requirements.md',
                            name: 'Requirements.md',
                            type: 'md',
                            file_id: response.file_id,
                        },
                    ],
                },
            ];
            dispatch({ type: 'SET_PROJECT_FILES', payload: projectFiles });
            
            addLog('success', `Project created: ${response.filename} (${response.size_bytes} bytes)`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create project';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [addLog]);

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
        fileType: 'markdown' | 'dafny'
    ) => {
        dispatch({ type: 'SET_SAVING', payload: true });
        
        try {
            const response = await apiClient.saveFile({
                filename,
                content,
                file_type: fileType,
            });
            addLog('success', `Saved ${response.filename}`);
        } catch (error) {
            addLog('error', `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [addLog]);

    const selectFile = useCallback((fileId: string | null) => {
        dispatch({ type: 'SELECT_FILE', payload: fileId });
    }, []);

    const setMarkdownContent = useCallback((content: string) => {
        dispatch({ type: 'SET_MARKDOWN_CONTENT', payload: content });
    }, []);

    const setDafnyCode = useCallback((code: string) => {
        dispatch({ type: 'SET_DAFNY_CODE', payload: code });
    }, []);

    const generateSpec = useCallback(async (englishSpec: string) => {
        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            addLog('info', 'Starting specification generation...');
            addLog('debug', `Input length: ${englishSpec.length} characters`);
            
            const response = await apiClient.generateSpec(englishSpec);
            
            dispatch({ type: 'SET_GENERATED_SPEC', payload: response });
            
            // Update project files with generated Dafny
            dispatch({
                type: 'SET_PROJECT_FILES',
                payload: [
                    {
                        id: 'root-spec',
                        name: 'Root Spec (Project)',
                        type: 'folder',
                        children: [
                            {
                                id: 'requirements.md',
                                name: 'Requirements.md',
                                type: 'md',
                            },
                            {
                                id: 'spec.dfy',
                                name: 'Spec.dfy',
                                type: 'dfy',
                                verificationStatus: 'pending',
                            },
                        ],
                    },
                ],
            });
            
            addLog('success', `Triage: ${response.triage.doc_type} (${(response.triage.confidence * 100).toFixed(0)}% confidence)`);
            addLog('info', `Generated ${response.dafny_skeleton.split('\n').length} lines of Dafny`);
            addLog('info', `Found ${response.gaps.length} gaps, ${response.ambiguities.length} ambiguities`);
            addLog('success', `Traceability: ${response.statistics.coverage_percentage.toFixed(0)}% coverage`);
            
            // Save the generated Dafny file
            await apiClient.saveFile({
                filename: 'spec.dfy',
                content: response.dafny_skeleton,
                file_type: 'dafny',
            });
            addLog('success', 'Saved spec.dfy');
            
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate specification';
            dispatch({ type: 'SET_ERROR', payload: message });
            addLog('error', message);
        } finally {
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    }, [addLog]);

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
            
            // Update verification status in project files
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

    const contextValue: ProjectContextType = {
        state,
        checkHealth,
        createProject,
        loadFiles,
        saveFile,
        selectFile,
        setMarkdownContent,
        setDafnyCode,
        generateSpec,
        runVerification,
        sendChatMessage,
        addLog,
        clearLogs,
        resetProject,
        setError,
        setDeconstructing,
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
