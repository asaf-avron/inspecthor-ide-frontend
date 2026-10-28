"use client";

import { AlertCircle, FileQuestion, FolderX, Ghost, MoveRight, Wrench, Link } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DriftIssue } from "@/lib/types";

export interface DriftIssueCardProps {
    issue: DriftIssue;
    onRepair: (issue: DriftIssue) => void;
    onManualRelink: (issue: DriftIssue) => void;
    disabled?: boolean;
}

const issueTypeConfig = {
    moved: {
        icon: MoveRight,
        label: "MOVED",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
    },
    corrupted: {
        icon: AlertCircle,
        label: "CORRUPTED",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
    },
    missing: {
        icon: FolderX,
        label: "MISSING",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
    orphaned: {
        icon: Ghost,
        label: "ORPHANED",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
    },
};

export function DriftIssueCard({
    issue,
    onRepair,
    onManualRelink,
    disabled,
}: DriftIssueCardProps) {
    const config = issueTypeConfig[issue.issue_type];
    const IssueIcon = config.icon;

    const handleRepair = () => {
        if (issue.can_auto_repair) {
            onRepair(issue);
        }
    };

    const showManualRelink = issue.issue_type === "moved" && !issue.found_path;

    return (
        <Card className="p-4">
            <div className="flex items-start space-x-3">
                <div className={`p-2 rounded ${config.bgColor}`}>
                    <IssueIcon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-bold ${config.color}`}>
                                    {config.label}
                                </span>
                                <span className="font-medium">{issue.component_name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {issue.description}
                            </p>
                        </div>
                    </div>

                    {/* Path Information */}
                    {issue.expected_path && (
                        <div className="text-sm space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-muted-foreground">Expected:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {issue.expected_path}
                                </code>
                            </div>
                            {issue.found_path && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-muted-foreground">Found at:</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {issue.found_path}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                        {issue.can_auto_repair && (
                            <Button
                                onClick={handleRepair}
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                            >
                                <Wrench className="h-3 w-3 mr-1" />
                                Repair
                            </Button>
                        )}
                        {showManualRelink && (
                            <Button
                                onClick={() => onManualRelink(issue)}
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                            >
                                <Link className="h-3 w-3 mr-1" />
                                Manual Relink
                            </Button>
                        )}
                        {!issue.can_auto_repair && !showManualRelink && (
                            <span className="text-xs text-muted-foreground">
                                Manual intervention required
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
