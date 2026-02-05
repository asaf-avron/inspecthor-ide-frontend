/**
 * Custom hook for drift detection and repair
 */

import { useState, useCallback } from 'react';
import { driftAPI } from '@/lib/api/drift';
import type {
    DriftIssue,
    DriftScanResponse,
    DriftRepairRequest,
} from '@/lib/types';

export interface UseDriftDetectionOptions {
    repoPath: string;
}

export interface UseDriftDetectionReturn {
    issues: DriftIssue[];
    healthScore: number;
    totalComponents: number;
    scanning: boolean;
    repairing: boolean;
    error: string | null;
    lastScan: string | null;
    scan: () => Promise<void>;
    repairIssue: (uuid: string, action: string, newPath?: string) => Promise<void>;
    autoRepairAll: () => Promise<void>;
    refreshHealth: () => Promise<void>;
}

export function useDriftDetection({
    repoPath,
}: UseDriftDetectionOptions): UseDriftDetectionReturn {
    const [issues, setIssues] = useState<DriftIssue[]>([]);
    const [healthScore, setHealthScore] = useState(100);
    const [totalComponents, setTotalComponents] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScan, setLastScan] = useState<string | null>(null);

    const scan = useCallback(async () => {
        if (!repoPath) return;

        setScanning(true);
        setError(null);

        try {
            const result = await driftAPI.scanForDrift(repoPath);
            setIssues(result.issues);
            setHealthScore(result.health_score);
            setTotalComponents(result.total_components);
            setLastScan(result.scan_timestamp);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to scan for drift');
            setIssues([]);
        } finally {
            setScanning(false);
        }
    }, [repoPath]);

    const repairIssue = useCallback(async (
        uuid: string,
        action: string,
        newPath?: string
    ) => {
        setRepairing(true);
        setError(null);

        try {
            const request: DriftRepairRequest = {
                uuid,
                action: action as any,
                new_path: newPath,
            };

            await driftAPI.repairDriftIssue(request);

            // Remove the repaired issue from the list
            setIssues(prev => prev.filter(issue => issue.uuid !== uuid));

            // Recalculate health score
            const remainingIssues = issues.filter(issue => issue.uuid !== uuid);
            if (totalComponents > 0) {
                const newScore = Math.round(
                    ((totalComponents - remainingIssues.length) / totalComponents) * 100
                );
                setHealthScore(newScore);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to repair issue');
            throw err;
        } finally {
            setRepairing(false);
        }
    }, [issues, totalComponents]);

    const autoRepairAll = useCallback(async () => {
        if (!repoPath) return;

        setRepairing(true);
        setError(null);

        try {
            const result = await driftAPI.autoRepairAll(repoPath);

            if (result.success) {
                // Re-scan to get updated state
                await scan();
            } else {
                setError(`Repaired ${result.repaired_count}, Failed ${result.failed_count}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to auto-repair');
        } finally {
            setRepairing(false);
        }
    }, [repoPath, scan]);

    const refreshHealth = useCallback(async () => {
        if (!repoPath) return;

        try {
            const health = await driftAPI.getHealthScore(repoPath);
            setHealthScore(health.health_score);
            setTotalComponents(health.total_components);
            setLastScan(health.last_scan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh health');
        }
    }, [repoPath]);

    return {
        issues,
        healthScore,
        totalComponents,
        scanning,
        repairing,
        error,
        lastScan,
        scan,
        repairIssue,
        autoRepairAll,
        refreshHealth,
    };
}
