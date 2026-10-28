/**
 * Proof Ledger API Client
 * Handles communication with the cryptographic proof ledger backend
 */

import type {
    LedgerEntry,
    LedgerHistoryResponse,
    ChainIntegrityResponse,
    LatestEntryResponse,
    CodeComparisonResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class LedgerAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'LedgerAPIError';
    }
}

/**
 * Base fetch wrapper for ledger API calls
 */
async function ledgerFetch<T>(
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

            throw new LedgerAPIError(errorMessage, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof LedgerAPIError) {
            throw error;
        }

        throw new LedgerAPIError(
            error instanceof Error ? error.message : 'Unknown error',
            undefined,
            error
        );
    }
}

/**
 * Get full ledger history for a component
 */
export async function getLedgerHistory(
    componentUuid: string
): Promise<LedgerHistoryResponse> {
    return ledgerFetch<LedgerHistoryResponse>(`/api/ledger/${componentUuid}`);
}

/**
 * Verify chain integrity for a component
 */
export async function verifyChainIntegrity(
    componentUuid: string
): Promise<ChainIntegrityResponse> {
    return ledgerFetch<ChainIntegrityResponse>(`/api/ledger/${componentUuid}/verify-chain`);
}

/**
 * Get latest ledger entry for a component
 */
export async function getLatestEntry(
    componentUuid: string
): Promise<LatestEntryResponse> {
    return ledgerFetch<LatestEntryResponse>(`/api/ledger/${componentUuid}/latest`);
}

/**
 * Compare verified code from ledger with current code
 */
export async function compareCode(
    componentUuid: string,
    entryId: string
): Promise<CodeComparisonResponse> {
    return ledgerFetch<CodeComparisonResponse>('/api/ledger/compare-code', {
        method: 'POST',
        body: JSON.stringify({
            uuid: componentUuid,
            entry_id: entryId,
        }),
    });
}

/**
 * Record a verification result in the ledger
 */
export async function recordVerification(
    componentUuid: string,
    dafnyContent: string,
    status: string,
    proofObligations: any[],
    dafnyVersion: string = '4.0.0'
): Promise<LedgerEntry> {
    return ledgerFetch<LedgerEntry>('/api/ledger/record', {
        method: 'POST',
        body: JSON.stringify({
            component_uuid: componentUuid,
            dafny_content: dafnyContent,
            status,
            proof_obligations: proofObligations,
            dafny_version: dafnyVersion,
        }),
    });
}

// Export ledger API client
export const ledgerAPI = {
    getLedgerHistory,
    verifyChainIntegrity,
    getLatestEntry,
    compareCode,
    recordVerification,
};

export default ledgerAPI;
