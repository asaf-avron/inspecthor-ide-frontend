/**
 * Drift Detection API Client
 * Handles component drift scanning, repair, and health monitoring
 */

import type {
    DriftScanResponse,
    DriftRepairRequest,
    DriftRepairResponse,
    DriftAutoRepairResponse,
    DriftHealthResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class DriftAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'DriftAPIError';
    }
}

/**
 * Base fetch wrapper for drift API calls
 */
async function driftFetch<T>(
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

            throw new DriftAPIError(errorMessage, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof DriftAPIError) {
            throw error;
        }

        throw new DriftAPIError(
            error instanceof Error ? error.message : 'Unknown error',
            undefined,
            error
        );
    }
}

/**
 * Scan repository for drift issues
 */
export async function scanForDrift(repoPath: string): Promise<DriftScanResponse> {
    return driftFetch<DriftScanResponse>('/api/drift/scan', {
        method: 'POST',
        body: JSON.stringify({ repo_path: repoPath }),
    });
}

/**
 * Repair a single drift issue
 */
export async function repairDriftIssue(
    request: DriftRepairRequest
): Promise<DriftRepairResponse> {
    return driftFetch<DriftRepairResponse>('/api/drift/repair', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Auto-repair all drift issues
 */
export async function autoRepairAll(repoPath: string): Promise<DriftAutoRepairResponse> {
    return driftFetch<DriftAutoRepairResponse>('/api/drift/auto-repair', {
        method: 'POST',
        body: JSON.stringify({ repo_path: repoPath }),
    });
}

/**
 * Get repository health score
 */
export async function getHealthScore(repoPath: string): Promise<DriftHealthResponse> {
    return driftFetch<DriftHealthResponse>(`/api/drift/health/${encodeURIComponent(repoPath)}`);
}

/**
 * Search for component by UUID (for manual relink)
 */
export async function searchByUuid(
    repoPath: string,
    uuid: string
): Promise<{ found: boolean; path: string | null }> {
    return driftFetch<{ found: boolean; path: string | null }>('/api/drift/search-by-uuid', {
        method: 'POST',
        body: JSON.stringify({ repo_path: repoPath, uuid }),
    });
}

/**
 * Verify file contains UUID (for manual relink)
 */
export async function verifyUuid(
    uuid: string,
    filePath: string
): Promise<{ valid: boolean; message: string }> {
    return driftFetch<{ valid: boolean; message: string }>('/api/drift/verify-uuid', {
        method: 'POST',
        body: JSON.stringify({ uuid, file_path: filePath }),
    });
}

/**
 * Manual relink component to new path
 */
export async function manualRelink(
    uuid: string,
    newPath: string
): Promise<DriftRepairResponse> {
    return driftFetch<DriftRepairResponse>('/api/drift/manual-relink', {
        method: 'POST',
        body: JSON.stringify({ uuid, new_path: newPath }),
    });
}

// Export drift API client
export const driftAPI = {
    scanForDrift,
    repairDriftIssue,
    autoRepairAll,
    getHealthScore,
    searchByUuid,
    verifyUuid,
    manualRelink,
};

export default driftAPI;
