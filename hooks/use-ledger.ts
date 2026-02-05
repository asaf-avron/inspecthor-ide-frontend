/**
 * Custom hook for managing proof ledger data
 */

import { useState, useEffect, useCallback } from 'react';
import { ledgerAPI } from '@/lib/api/ledger';
import type {
    LedgerEntry,
    LedgerHistoryResponse,
    ChainIntegrityResponse,
} from '@/lib/types';

export interface UseLedgerOptions {
    componentUuid: string;
    autoRefresh?: boolean;
    refreshInterval?: number; // milliseconds
}

export interface UseLedgerReturn {
    entries: LedgerEntry[];
    totalEntries: number;
    latestEntry: LedgerEntry | null;
    chainValid: boolean;
    chainErrors: string[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    checkIntegrity: () => Promise<void>;
}

export function useLedger({
    componentUuid,
    autoRefresh = false,
    refreshInterval = 30000,
}: UseLedgerOptions): UseLedgerReturn {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [chainValid, setChainValid] = useState(true);
    const [chainErrors, setChainErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const latestEntry = entries.length > 0 ? entries[0] : null;

    const refresh = useCallback(async () => {
        if (!componentUuid) return;

        setLoading(true);
        setError(null);

        try {
            const history = await ledgerAPI.getLedgerHistory(componentUuid);
            setEntries(history.entries);
            setTotalEntries(history.total_entries);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ledger history');
            setEntries([]);
            setTotalEntries(0);
        } finally {
            setLoading(false);
        }
    }, [componentUuid]);

    const checkIntegrity = useCallback(async () => {
        if (!componentUuid) return;

        try {
            const integrity = await ledgerAPI.verifyChainIntegrity(componentUuid);
            setChainValid(integrity.chain_valid);
            setChainErrors(integrity.errors);
        } catch (err) {
            setChainValid(false);
            setChainErrors([err instanceof Error ? err.message : 'Failed to verify chain integrity']);
        }
    }, [componentUuid]);

    // Initial load
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Auto-check integrity after loading entries
    useEffect(() => {
        if (entries.length > 0 && !loading) {
            checkIntegrity();
        }
    }, [entries.length, loading, checkIntegrity]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh || refreshInterval <= 0) return;

        const intervalId = setInterval(refresh, refreshInterval);

        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshInterval, refresh]);

    return {
        entries,
        totalEntries,
        latestEntry,
        chainValid,
        chainErrors,
        loading,
        error,
        refresh,
        checkIntegrity,
    };
}
