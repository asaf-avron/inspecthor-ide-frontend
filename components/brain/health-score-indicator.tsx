"use client";

import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface HealthScoreIndicatorProps {
    score: number;
    totalComponents: number;
    issuesCount: number;
}

export function HealthScoreIndicator({
    score,
    totalComponents,
    issuesCount,
}: HealthScoreIndicatorProps) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        if (score >= 50) return "text-orange-500";
        return "text-destructive";
    };

    const getScoreIcon = (score: number) => {
        if (score >= 90) return CheckCircle2;
        if (score >= 50) return AlertTriangle;
        return AlertTriangle;
    };

    const getProgressColor = (score: number) => {
        if (score >= 90) return "bg-green-500";
        if (score >= 70) return "bg-yellow-500";
        if (score >= 50) return "bg-orange-500";
        return "bg-destructive";
    };

    const ScoreIcon = getScoreIcon(score);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ScoreIcon className={`h-5 w-5 ${getScoreColor(score)}`} />
                    <span className="text-lg font-semibold">
                        Health Score: <span className={getScoreColor(score)}>{score}%</span>
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    {totalComponents} component{totalComponents === 1 ? '' : 's'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${getProgressColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Issues Summary */}
            {issuesCount > 0 && (
                <div className="text-sm text-muted-foreground">
                    {issuesCount} issue{issuesCount === 1 ? '' : 's'} detected
                </div>
            )}
        </div>
    );
}
