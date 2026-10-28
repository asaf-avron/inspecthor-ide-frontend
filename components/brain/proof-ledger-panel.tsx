"use client";

import { useState } from "react";
import { Shield, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLedger } from "@/hooks/use-ledger";
import { LedgerTimeline } from "./ledger-timeline";
import { IntegrityChecker } from "./integrity-checker";
import { TamperAlert } from "./tamper-alert";
import { LedgerDiffViewer } from "./ledger-diff-viewer";

export interface ProofLedgerPanelProps {
    componentUuid: string;
    componentName?: string;
    showDiffViewer?: boolean;
}

export function ProofLedgerPanel({
    componentUuid,
    componentName = "Component",
    showDiffViewer = false,
}: ProofLedgerPanelProps) {
    const {
        entries,
        totalEntries,
        latestEntry,
        chainValid,
        chainErrors,
        loading,
        error,
        refresh,
        checkIntegrity,
    } = useLedger({ componentUuid, autoRefresh: false });

    const [showingDiff, setShowingDiff] = useState(showDiffViewer);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const handleViewDiff = (entryId: string) => {
        setSelectedEntryId(entryId);
        setShowingDiff(true);
    };

    const handleCloseDiff = () => {
        setShowingDiff(false);
        setSelectedEntryId(null);
    };

    if (loading && entries.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading proof ledger...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="p-6 border-destructive">
                    <div className="flex items-center space-x-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                            <p className="font-semibold">Failed to load proof ledger</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <Button
                        onClick={refresh}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </Card>
            </div>
        );
    }

    if (showingDiff && selectedEntryId) {
        return (
            <LedgerDiffViewer
                componentUuid={componentUuid}
                entryId={selectedEntryId}
                onClose={handleCloseDiff}
            />
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-lg font-semibold">Proof Ledger</h2>
                        <p className="text-sm text-muted-foreground">
                            Component: {componentName}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={refresh}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Chain Status */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {chainValid ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Chain Valid</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <span className="font-medium text-destructive">Chain Invalid</span>
                            </>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
                    </div>
                </div>

                {!chainValid && chainErrors.length > 0 && (
                    <TamperAlert errors={chainErrors} className="mt-4" />
                )}

                <IntegrityChecker
                    componentUuid={componentUuid}
                    chainValid={chainValid}
                    onCheck={checkIntegrity}
                    className="mt-4"
                />
            </Card>

            {/* Timeline */}
            {entries.length > 0 ? (
                <LedgerTimeline
                    entries={entries}
                    onViewDiff={handleViewDiff}
                />
            ) : (
                <Card className="p-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No verification history yet</p>
                    <p className="text-sm mt-2">
                        Run verification to create the first ledger entry
                    </p>
                </Card>
            )}
        </div>
    );
}
