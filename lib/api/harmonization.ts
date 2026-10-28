/**
 * Harmonization API Client
 * Handles synchronization between spec, Dafny, and code
 */

import type {
    HarmonizationStatusResponse,
    SpecDiffResponse,
    HarmonizeRequest,
    HarmonizeResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class HarmonizationAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'HarmonizationAPIError';
    }
}

/**
 * Base fetch wrapper for harmonization API calls
 */
async function harmonizationFetch<T>(
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

            throw new HarmonizationAPIError(errorMessage, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof HarmonizationAPIError) {
            throw error;
        }

        throw new HarmonizationAPIError(
            error instanceof Error ? error.message : 'Unknown error',
            undefined,
            error
        );
    }
}

/**
 * Get synchronization status for a blueprint
 */
export async function getHarmonizationStatus(
    blueprintId: string
): Promise<HarmonizationStatusResponse> {
    return harmonizationFetch<HarmonizationStatusResponse>(
        `/api/harmonization/status/${blueprintId}`
    );
}

/**
 * Get spec diff (what changed in spec since last sync)
 */
export async function getSpecDiff(
    blueprintId: string
): Promise<SpecDiffResponse> {
    return harmonizationFetch<SpecDiffResponse>(
        `/api/harmonization/diff/${blueprintId}`
    );
}

/**
 * Trigger harmonization process
 */
export async function harmonize(
    request: HarmonizeRequest
): Promise<HarmonizeResponse> {
    return harmonizationFetch<HarmonizeResponse>('/api/harmonization/harmonize', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Export harmonization API client
export const harmonizationAPI = {
    getHarmonizationStatus,
    getSpecDiff,
    harmonize,
};

export default harmonizationAPI;
