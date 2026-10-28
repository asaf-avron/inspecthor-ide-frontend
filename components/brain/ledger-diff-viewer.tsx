"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, FileSearch, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ledgerAPI } from "@/lib/api/ledger";
import type { CodeComparisonResponse } from "@/lib/types";

export interface LedgerDiffViewerProps {
    componentUuid: string;
    entryId: string;
    onClose: () => void;
}

export function LedgerDiffViewer({
    componentUuid,
    entryId,
    onClose,
}: LedgerDiffViewerProps) {
    const [comparison, setComparison] = useState<CodeComparisonResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadComparison();
    }, [componentUuid, entryId]);

    const loadComparison = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await ledgerAPI.compareCode(componentUuid, entryId);
            setComparison(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load code comparison');
        } finally {
            setLoading(false);
        }
    };

    const exportForensicReport = () => {
        if (!comparison) return;

        const report = {
            component_uuid: comparison.uuid,
            entry_id: comparison.entry_id,
            timestamp: new Date().toISOString(),
            hash_match: comparison.hash_match,
            verified_hash: comparison.verified_hash,
            current_hash: comparison.current_hash,
            changes: comparison.changes_summary,
            diff: comparison.diff,
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forensic-report-${componentUuid}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderCodeWithLineNumbers = (code: string, highlightedLines: number[], side: 'left' | 'right') => {
        const lines = code.split('\n');
        return (
            <div className="font-mono text-sm">
                {lines.map((line, index) => {
                    const lineNumber = index + 1;
                    const isHighlighted = highlightedLines.includes(lineNumber);
                    const bgColor = side === 'left'
                        ? isHighlighted ? 'bg-red-100 dark:bg-red-900/30' : ''
                        : isHighlighted ? 'bg-green-100 dark:bg-green-900/30' : '';

                    return (
                        <div
                            key={index}
                            className={`flex ${bgColor} hover:bg-muted/50`}
                        >
                            <span className="w-12 flex-shrink-0 text-right pr-4 text-muted-foreground select-none">
                                {lineNumber}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-all">{line || ' '}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading code comparison...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="p-6 border-destructive">
                    <div className="flex items-center space-x-2 text-destructive mb-4">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                            <p className="font-semibold">Failed to load comparison</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={loadComparison} variant="outline" size="sm">
                            Retry
                        </Button>
                        <Button onClick={onClose} variant="outline" size="sm">
                            Close
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!comparison) return null;

    const allHighlightedLines = [
        ...comparison.diff.added_lines,
        ...comparison.diff.removed_lines,
        ...comparison.diff.modified_lines,
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                    <FileSearch className="h-5 w-5" />
                    <div>
                        <h2 className="text-lg font-semibold">Code Comparison</h2>
                        {!comparison.hash_match && (
                            <div className="flex items-center space-x-1 text-destructive text-sm mt-1">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Hash Mismatch Detected</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={exportForensicReport} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button onClick={onClose} variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Hash comparison */}
            <div className="p-4 bg-muted/50 border-b space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verified Hash:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                        {comparison.verified_hash}
                    </code>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Hash:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                        {comparison.current_hash}
                    </code>
                </div>
            </div>

            {/* Changes Summary */}
            {comparison.changes_summary.length > 0 && (
                <div className="p-4 bg-destructive/10 border-b">
                    <h3 className="font-semibold text-sm mb-2">Changes Detected:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                        {comparison.changes_summary.map((change, index) => (
                            <li key={index}>{change}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Side-by-side diff */}
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 h-full">
                    {/* Verified Code (Left) */}
                    <div className="border-r overflow-auto">
                        <div className="sticky top-0 bg-muted p-2 border-b">
                            <h3 className="font-semibold text-sm">Verified Code</h3>
                            <p className="text-xs text-muted-foreground">From proof ledger entry</p>
                        </div>
                        <div className="p-4">
                            {renderCodeWithLineNumbers(
                                comparison.verified_code,
                                comparison.diff.removed_lines,
                                'left'
                            )}
                        </div>
                    </div>

                    {/* Current Code (Right) */}
                    <div className="overflow-auto">
                        <div className="sticky top-0 bg-muted p-2 border-b">
                            <h3 className="font-semibold text-sm">Current Code</h3>
                            <p className="text-xs text-muted-foreground">Current file state</p>
                        </div>
                        <div className="p-4">
                            {renderCodeWithLineNumbers(
                                comparison.current_code,
                                comparison.diff.added_lines,
                                'right'
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            {!comparison.hash_match && (
                <div className="p-4 border-t bg-muted/50 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        The current code differs from the verified version.
                    </p>
                    <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore Verified Version
                    </Button>
                </div>
            )}
        </div>
    );
}
