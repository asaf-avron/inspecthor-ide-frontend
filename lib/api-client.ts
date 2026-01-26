/**
 * API Client for Guardian Gateway Backend
 * Handles all communication with the FastAPI backend
 */

import type {
    HealthResponse,
    GenerateSpecResponse,
    ChatRequest,
    ChatResponse,
    ChatContext,
    ChatMessage,
    FileSaveRequest,
    FileSaveResponse,
    FileResponse,
    FileListResponse,
    FileDeleteResponse,
    VerifyRequest,
    VerifyResponse,
    RigorLevel,
} from './types';

// Re-export types for convenience
export type {
    HealthResponse,
    GenerateSpecResponse,
    ChatRequest,
    ChatResponse,
    ChatContext,
    ChatMessage,
    FileSaveRequest,
    FileSaveResponse,
    FileResponse,
    FileListResponse,
    FileDeleteResponse,
    VerifyRequest,
    VerifyResponse,
    Gap,
    Ambiguity,
    TraceabilityEntry,
    SpecStatistics,
    ProofObligation,
    VerificationResult,
    VerificationError,
    LogEntry,
} from './types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.GUARDIAN_API_KEY || '';

export class APIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Base fetch wrapper with error handling and authentication
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Add API key to headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add API key if available (not required for health check)
    if (API_KEY && !endpoint.includes('/health')) {
        headers['X-API-Key'] = API_KEY;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new APIError(
                errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        return await response.json();
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }

        // Network or other errors
        throw new APIError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            undefined,
            error
        );
    }
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>('/api/health');
}

/**
 * Generate Dafny specification from English requirements
 */
export async function generateSpec(
    englishSpec: string,
    rigorLevel: RigorLevel = 'standard'
): Promise<GenerateSpecResponse> {
    return apiFetch<GenerateSpecResponse>('/api/generate/spec', {
        method: 'POST',
        body: JSON.stringify({ 
            english_spec: englishSpec,
            rigor_level: rigorLevel,
        }),
    });
}

/**
 * Chat with AI assistant
 */
export async function chatWithAssistant(
    message: string,
    context?: ChatContext,
    history?: ChatMessage[]
): Promise<ChatResponse> {
    return apiFetch<ChatResponse>('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context, history }),
    });
}

// === File Management APIs ===

/**
 * Save a file to the backend
 */
export async function saveFile(
    request: FileSaveRequest
): Promise<FileSaveResponse> {
    return apiFetch<FileSaveResponse>('/api/files/save', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Get a file by ID
 */
export async function getFile(fileId: string): Promise<FileResponse> {
    return apiFetch<FileResponse>(`/api/files/${fileId}`);
}

/**
 * List all files, optionally filtered by project or type
 */
export async function listFiles(
    projectId?: string,
    fileType?: string
): Promise<FileListResponse> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (fileType) params.append('file_type', fileType);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/files?${queryString}` : '/api/files';
    
    return apiFetch<FileListResponse>(endpoint);
}

/**
 * Delete a file by ID
 */
export async function deleteFile(fileId: string): Promise<FileDeleteResponse> {
    return apiFetch<FileDeleteResponse>(`/api/files/${fileId}`, {
        method: 'DELETE',
    });
}

// === Verification APIs ===

/**
 * Verify Dafny code
 */
export async function verifyDafny(
    request: VerifyRequest
): Promise<VerifyResponse> {
    return apiFetch<VerifyResponse>('/api/verify', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Retry wrapper for API calls
 * Retries failed requests up to maxRetries times with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on client errors (4xx)
            if (error instanceof APIError && error.status && error.status < 500) {
                throw error;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

// Export configured API client
export const apiClient = {
    // Health
    checkHealth,
    // Generation
    generateSpec,
    // Chat
    chatWithAssistant,
    // Files
    saveFile,
    getFile,
    listFiles,
    deleteFile,
    // Verification
    verifyDafny,
    // Utilities
    withRetry,
};

export default apiClient;
