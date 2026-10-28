"use client";

import { useState } from "react";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDriftDetection } from "@/hooks/use-drift-detection";
import { HealthScoreIndicator } from "./health-score-indicator";
import { DriftIssueCard } from "./drift-issue-card";
import { RepairConfirmationModal } from "./repair-confirmation-modal";
import { ManualRelinkModal } from "./manual-relink-modal";
import type { DriftIssue } from "@/lib/types";

export interface DriftDetectorPanelProps {
    repoPath: string;
}

export function DriftDetectorPanel({ repoPath }: DriftDetectorPanelProps) {
    const {
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
    } = useDriftDetection({ repoPath });

    const [showRepairConfirmation, setShowRepairConfirmation] = useState(false);
    const [showManualRelink, setShowManualRelink] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<DriftIssue | null>(null);

    const handleRepairAll = () => {
        setShowRepairConfirmation(true);
    };

    const confirmRepairAll = async () => {
        setShowRepairConfirmation(false);
        await autoRepairAll();
    };

    const handleManualRelink = (issue: DriftIssue) => {
        setSelectedIssue(issue);
        setShowManualRelink(true);
    };

    const handleRepairSingle = async (issue: DriftIssue) => {
        try {
            await repairIssue(issue.uuid, issue.suggested_action);
        } catch (err) {
            // Error handled in hook
        }
    };

    const formatLastScan = (timestamp: string | null) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    };

    if (error && issues.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="p-6 border-destructive">
                    <div className="flex items-center space-x-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                            <p className="font-semibold">Failed to scan for drift</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                    <Button
                        onClick={scan}
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

    return (
        <>
            <div className="flex flex-col h-full space-y-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <div>
                            <h2 className="text-lg font-semibold">Component Health</h2>
                            <p className="text-sm text-muted-foreground">
                                Last scan: {formatLastScan(lastScan)}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={scan}
                        variant="outline"
                        size="sm"
                        disabled={scanning}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
                        {scanning ? 'Scanning...' : 'Scan Now'}
                    </Button>
                </div>

                {/* Health Score */}
                <Card className="p-4">
                    <HealthScoreIndicator
                        score={healthScore}
                        totalComponents={totalComponents}
                        issuesCount={issues.length}
                    />

                    {issues.length > 0 && (
                        <div className="flex items-center justify-end mt-4 pt-4 border-t">
                            <Button
                                onClick={handleRepairAll}
                                variant="default"
                                size="sm"
                                disabled={repairing || scanning}
                            >
                                <Wrench className="h-4 w-4 mr-2" />
                                {repairing ? 'Repairing...' : 'Auto-Repair All'}
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Issues List */}
                {issues.length > 0 ? (
                    <div className="flex-1 overflow-y-auto space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Issues ({issues.length})
                        </h3>
                        {issues.map((issue) => (
                            <DriftIssueCard
                                key={issue.uuid}
                                issue={issue}
                                onRepair={handleRepairSingle}
                                onManualRelink={handleManualRelink}
                                disabled={repairing || scanning}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center">
                        <div>
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="font-semibold">No drift detected!</p>
                            <p className="text-sm mt-2">
                                All components are in sync
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Modals */}
            <RepairConfirmationModal
                open={showRepairConfirmation}
                onOpenChange={setShowRepairConfirmation}
                issuesCount={issues.length}
                onConfirm={confirmRepairAll}
            />

            {selectedIssue && (
                <ManualRelinkModal
                    open={showManualRelink}
                    onOpenChange={setShowManualRelink}
                    issue={selectedIssue}
                    repoPath={repoPath}
                    onRelink={async (newPath) => {
                        await repairIssue(selectedIssue.uuid, 'update_registry', newPath);
                        setShowManualRelink(false);
                    }}
                />
            )}
        </>
    );
}
