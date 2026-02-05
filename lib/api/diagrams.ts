/**
 * Diagram Generation API Client
 * Handles Mermaid diagram generation and comparison
 */

import type {
    GenerateDiagramRequest,
    GenerateDiagramResponse,
    CompareDiagramsRequest,
    CompareDiagramsResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class DiagramAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'DiagramAPIError';
    }
}

/**
 * Base fetch wrapper for diagram API calls
 */
async function diagramFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // Ignore JSON parse errors
            }

            throw new DiagramAPIError(errorMessage, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof DiagramAPIError) {
            throw error;
        }

        throw new DiagramAPIError(
            error instanceof Error ? error.message : 'Unknown error',
            undefined,
            error
        );
    }
}

/**
 * Generate diagram from specification (expected diagram)
 */
export async function generateExpectedDiagram(
    specContent: string
): Promise<GenerateDiagramResponse> {
    return diagramFetch<GenerateDiagramResponse>('/api/diagrams/generate-expected', {
        method: 'POST',
        body: JSON.stringify({
            source_type: 'spec',
            source_content: specContent,
            format: 'mermaid',
        }),
    });
}

/**
 * Generate diagram from Python code (actual diagram)
 */
export async function generateActualDiagram(
    pythonCode: string
): Promise<GenerateDiagramResponse> {
    return diagramFetch<GenerateDiagramResponse>('/api/diagrams/generate-actual', {
        method: 'POST',
        body: JSON.stringify({
            source_type: 'code',
            source_content: pythonCode,
            format: 'mermaid',
        }),
    });
}

/**
 * Compare expected vs actual diagrams
 */
export async function compareDiagrams(
    expectedDiagram: string,
    actualDiagram: string
): Promise<CompareDiagramsResponse> {
    return diagramFetch<CompareDiagramsResponse>('/api/diagrams/compare', {
        method: 'POST',
        body: JSON.stringify({
            expected_diagram: expectedDiagram,
            actual_diagram: actualDiagram,
        }),
    });
}

// Export diagram API client
export const diagramAPI = {
    generateExpectedDiagram,
    generateActualDiagram,
    compareDiagrams,
};

export default diagramAPI;
