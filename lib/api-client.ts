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
    FileUpdateRequest,
    FileResponse,
    FileListResponse,
    FileDeleteResponse,
    BlueprintCreateRequest,
    BlueprintUpdateRequest,
    BlueprintResponse,
    BlueprintListParams,
    BlueprintListResponse,
    BlueprintStructureResponse,
    BlueprintDeleteResponse,
    VerifyRequest,
    VerifyResponse,
    RigorLevel,
    DeconstructRequest,
    DeconstructResponse,
    TraceabilityResponse,
    FindGapsRequest,
    FindGapsResponse,
    RefineSpecRequest,
    RefineSpecResponse,
    BlueprintInitRequest,
    BlueprintInitResponse,
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
const API_KEY = process.env.NEXT_PUBLIC_GUARDIAN_API_KEY || '';

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
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // Add API key if available (not required for health check)
    if (API_KEY && !endpoint.includes('/health')) {
        headers.set('X-API-Key', API_KEY);
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
            let errorData: any = {};
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                    // Handle different error response formats
                    if (errorData.detail) {
                        errorMessage = typeof errorData.detail === 'string'
                            ? errorData.detail
                            : JSON.stringify(errorData.detail);
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = typeof errorData.error === 'string'
                            ? errorData.error
                            : JSON.stringify(errorData.error);
                    }
                } else {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
            } catch (parseError) {
                // If we can't parse the error, use the status text
                console.error('Failed to parse error response:', parseError);
            }

            throw new APIError(
                errorMessage,
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
        let errorMessage = 'Unknown error occurred';
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            errorMessage = `Cannot connect to backend at ${API_BASE_URL}. Please ensure the API server is running.`;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            errorMessage = JSON.stringify(error);
        }

        throw new APIError(
            errorMessage,
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
    rigorLevel: RigorLevel = 'standard',
    currentFilename?: string,
    blueprintId?: string,
    sourceFileId?: string
): Promise<GenerateSpecResponse> {
    return apiFetch<GenerateSpecResponse>('/api/generate/spec', {
        method: 'POST',
        body: JSON.stringify({
            english_spec: englishSpec,
            rigor_level: rigorLevel,
            current_filename: currentFilename,
            blueprint_id: blueprintId,
            source_file_id: sourceFileId,
        }),
    });
}

/**
 * Refine specification by applying gap suggestions
 */
export async function findGaps(
    request: FindGapsRequest
): Promise<FindGapsResponse> {
    return apiFetch<FindGapsResponse>('/api/generate/find-gaps', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

export async function refineSpec(
    request: RefineSpecRequest
): Promise<RefineSpecResponse> {
    return apiFetch<RefineSpecResponse>('/api/generate/refine-spec', {
        method: 'POST',
        body: JSON.stringify(request),
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
    blueprintId?: string,
    fileType?: string
): Promise<FileListResponse> {
    const params = new URLSearchParams();
    if (blueprintId) params.append('blueprint_id', blueprintId);
    if (fileType) params.append('file_type', fileType);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/files?${queryString}` : '/api/files';

    return apiFetch<FileListResponse>(endpoint);
}

/**
 * Update a file by ID (atomic update)
 * Convenience wrapper with direct parameters
 */
export async function updateFile(
    fileId: string,
    content: string,
    filename?: string
): Promise<FileResponse> {
    const request: FileUpdateRequest = { content };
    if (filename) {
        request.filename = filename;
    }
    return apiFetch<FileResponse>(`/api/files/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
    });
}

/**
 * Update a file by ID (atomic update)
 * Full request object version
 */
export async function updateFileWithRequest(
    fileId: string,
    request: FileUpdateRequest
): Promise<FileResponse> {
    return apiFetch<FileResponse>(`/api/files/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
    });
}

/**
 * Delete a file by ID
 */
export async function deleteFile(fileId: string): Promise<FileDeleteResponse> {
    return apiFetch<FileDeleteResponse>(`/api/files/${fileId}`, {
        method: 'DELETE',
    });
}

// === Blueprint Management APIs ===

/**
 * Create a new blueprint
 */
export async function createBlueprint(
    name: string,
    description?: string
): Promise<BlueprintResponse> {
    const payload: { name: string; description?: string } = { name };
    if (description) {
        payload.description = description;
    }
    return apiFetch<BlueprintResponse>('/api/blueprints', { // Endpoint without slash usually
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * List all blueprints with pagination and sorting
 */
export async function listBlueprints(
    params?: BlueprintListParams
): Promise<BlueprintListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/blueprints?${queryString}` : '/api/blueprints';

    return apiFetch<BlueprintListResponse>(endpoint);
}

/**
 * Get blueprint structure (blueprint + file tree) in one RTT
 */
export async function getBlueprintStructure(
    blueprintId: string
): Promise<BlueprintStructureResponse> {
    return apiFetch<BlueprintStructureResponse>(`/api/blueprints/${blueprintId}/structure`);
}

/**
 * Get single blueprint details
 */
export async function getBlueprint(blueprintId: string): Promise<BlueprintResponse> {
    return apiFetch<BlueprintResponse>(`/api/blueprints/${blueprintId}`);
}

/**
 * Update blueprint (name and/or description)
 */
export async function updateBlueprint(
    blueprintId: string,
    updates: BlueprintUpdateRequest
): Promise<BlueprintResponse> {
    return apiFetch<BlueprintResponse>(`/api/blueprints/${blueprintId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

/**
 * Delete blueprint (cascade deletes all files)
 */
export async function deleteBlueprint(
    blueprintId: string
): Promise<BlueprintDeleteResponse> {
    return apiFetch<BlueprintDeleteResponse>(`/api/blueprints/${blueprintId}`, {
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

// === Deconstruction APIs ===

/**
 * Deconstruct a specification into verifiable units
 */
export async function deconstructSpec(
    request: DeconstructRequest
): Promise<DeconstructResponse> {
    return apiFetch<DeconstructResponse>('/api/deconstruct', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Get traceability links for a specification file
 */
export async function getTraceability(
    fileId: string
): Promise<TraceabilityResponse> {
    return apiFetch<TraceabilityResponse>(`/api/files/${fileId}/traceability`);
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

// === Blueprint APIs ===

/**
 * Initialize a GitHub repository with the Trusted Kernel Architecture.
 * 
 * This is the "Genesis Event" that pushes the initial structure:
 * - blueprint.yaml (manifest)
 * - kernel/Main.dfy (verified zone)
 * - shell/main.py (I/O zone)
 * - .github/workflows/verify.yml (CI enforcement)
 */
export async function initializeBlueprint(
    request: BlueprintInitRequest
): Promise<BlueprintInitResponse> {
    return apiFetch<BlueprintInitResponse>('/api/blueprints/initialize', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Export configured API client
export const apiClient = {
    // Health
    checkHealth,
    // Generation
    generateSpec,
    findGaps,
    refineSpec,
    // Chat
    chatWithAssistant,
    // Files
    saveFile,
    getFile,
    updateFile,
    listFiles,
    deleteFile,
    // Blueprints
    createBlueprint,
    listBlueprints,
    getBlueprintStructure,
    getBlueprint,
    updateBlueprint,
    deleteBlueprint,
    // Verification
    verifyDafny,
    // Deconstruction
    deconstructSpec,
    getTraceability,
    // Blueprint Init
    initializeBlueprint,
    // Utilities
    withRetry,
};

export default apiClient;

