"use client";

import { useState, useEffect } from "react";
import { MermaidViewer } from "./mermaid-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { diagramAPI } from "@/lib/api/diagrams";
import type { CompareDiagramsResponse } from "@/lib/types";

export interface DiagramComparisonProps {
    expectedDiagram: string;
    actualDiagram: string;
    autoCompare?: boolean;
}

export function DiagramComparison({
    expectedDiagram,
    actualDiagram,
    autoCompare = false,
}: DiagramComparisonProps) {
    const [comparison, setComparison] = useState<CompareDiagramsResponse | null>(null);
    const [comparing, setComparing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (autoCompare && expectedDiagram && actualDiagram) {
            handleCompare();
        }
    }, [expectedDiagram, actualDiagram, autoCompare]);

    const handleCompare = async () => {
        setComparing(true);
        setError(null);

        try {
            const result = await diagramAPI.compareDiagrams(expectedDiagram, actualDiagram);
            setComparison(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to compare diagrams');
        } finally {
            setComparing(false);
        }
    };

    const getSimilarityColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        if (score >= 50) return "text-orange-500";
        return "text-destructive";
    };

    const getSimilarityIcon = (score: number) => {
        if (score >= 80) return CheckCircle2;
        return AlertTriangle;
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Comparison Summary */}
            {comparison && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {(() => {
                                const Icon = getSimilarityIcon(comparison.similarity_score);
                                return (
                                    <Icon className={`h-5 w-5 ${getSimilarityColor(comparison.similarity_score)}`} />
                                );
                            })()}
                            <div>
                                <p className="font-semibold">
                                    Similarity: <span className={getSimilarityColor(comparison.similarity_score)}>
                                        {Math.round(comparison.similarity_score)}%
                                    </span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {comparison.differences.length} difference{comparison.differences.length === 1 ? '' : 's'} detected
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleCompare}
                            variant="outline"
                            size="sm"
                            disabled={comparing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${comparing ? 'animate-spin' : ''}`} />
                            Re-compare
                        </Button>
                    </div>

                    {/* Differences */}
                    {comparison.differences.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                            <p className="text-sm font-semibold">Differences:</p>
                            <div className="space-y-1">
                                {comparison.missing_nodes.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-yellow-500">⚠️ Missing nodes:</span>{' '}
                                        {comparison.missing_nodes.join(', ')}
                                    </div>
                                )}
                                {comparison.extra_nodes.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-destructive">🔴 Extra nodes:</span>{' '}
                                        {comparison.extra_nodes.join(', ')}
                                    </div>
                                )}
                                {comparison.missing_edges.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-yellow-500">⚠️ Missing connections:</span>{' '}
                                        {comparison.missing_edges.length} edge{comparison.missing_edges.length === 1 ? '' : 's'}
                                    </div>
                                )}
                                {comparison.extra_edges.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-destructive">🔴 Extra connections:</span>{' '}
                                        {comparison.extra_edges.length} edge{comparison.extra_edges.length === 1 ? '' : 's'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Side-by-side Diagrams */}
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                {/* Expected (Spec) */}
                <Card className="flex flex-col overflow-hidden">
                    <div className="p-3 border-b bg-muted/50">
                        <p className="text-sm font-semibold">Expected (from Spec)</p>
                        <p className="text-xs text-muted-foreground">What the specification defines</p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MermaidViewer
                            diagramCode={expectedDiagram}
                            title="Expected"
                        />
                    </div>
                </Card>

                {/* Actual (Code) */}
                <Card className="flex flex-col overflow-hidden">
                    <div className="p-3 border-b bg-muted/50">
                        <p className="text-sm font-semibold">Actual (from Code)</p>
                        <p className="text-xs text-muted-foreground">What the code implements</p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MermaidViewer
                            diagramCode={actualDiagram}
                            title="Actual"
                        />
                    </div>
                </Card>
            </div>

            {/* Compare Button (if not auto-comparing) */}
            {!autoCompare && !comparison && (
                <div className="flex justify-center">
                    <Button
                        onClick={handleCompare}
                        disabled={comparing || !expectedDiagram || !actualDiagram}
                    >
                        {comparing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Comparing...
                            </>
                        ) : (
                            <>Compare Diagrams</>
                        )}
                    </Button>
                </div>
            )}

            {/* Error */}
            {error && (
                <Card className="p-4 border-destructive">
                    <p className="text-sm text-destructive">{error}</p>
                </Card>
            )}
        </div>
    );
}
