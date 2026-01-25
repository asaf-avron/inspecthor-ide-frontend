/**
 * API Client for Guardian Gateway Backend
 * Handles all communication with the FastAPI backend
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.GUARDIAN_API_KEY || '';

// Type Definitions
export interface HealthResponse {
    status: string;
    gemini_configured: boolean;
    dafny_available: boolean;
}

export interface GenerateSpecRequest {
    english_spec: string;
}

export interface Gap {
    severity: string;
    description: string;
    location: string;
}

export interface TraceabilityEntry {
    id: string;
    source_text: string;
    code_line: string;
    status: string;
}

export interface GenerateSpecResponse {
    triage: {
        doc_type: string;
        confidence: number;
    };
    structured_spec: string;
    dafny_skeleton: string;
    gaps: Gap[];
    ambiguities: string[];
    traceability_matrix: TraceabilityEntry[];
}

export interface ChatRequest {
    message: string;
    context?: string;
}

export interface ChatResponse {
    content: string;
    suggestions: string[];
}

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
    englishSpec: string
): Promise<GenerateSpecResponse> {
    return apiFetch<GenerateSpecResponse>('/api/generate/spec', {
        method: 'POST',
        body: JSON.stringify({ english_spec: englishSpec }),
    });
}

/**
 * Chat with AI assistant
 */
export async function chatWithAssistant(
    message: string,
    context?: string
): Promise<ChatResponse> {
    return apiFetch<ChatResponse>('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
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
    checkHealth,
    generateSpec,
    chatWithAssistant,
    withRetry,
};

export default apiClient;
