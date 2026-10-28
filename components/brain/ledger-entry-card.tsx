"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Copy, ChevronRight, FileSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LedgerEntry, LedgerVerificationStatus } from "@/lib/types";

export interface LedgerEntryCardProps {
    entry: LedgerEntry;
    isLatest?: boolean;
    onViewDiff?: (entryId: string) => void;
}

const statusConfig: Record<LedgerVerificationStatus, {
    icon: React.ComponentType<any>;
    className: string;
    label: string;
}> = {
    verified: {
        icon: CheckCircle2,
        className: "text-green-500",
        label: "Verified",
    },
    failed: {
        icon: XCircle,
        className: "text-destructive",
        label: "Failed",
    },
    timeout: {
        icon: Clock,
        className: "text-warning",
        label: "Timeout",
    },
    error: {
        icon: AlertTriangle,
        className: "text-destructive",
        label: "Error",
    },
};

export function LedgerEntryCard({ entry, isLatest, onViewDiff }: LedgerEntryCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [hashCopied, setHashCopied] = useState(false);

    const config = statusConfig[entry.verification_status] || statusConfig.error;
    const StatusIcon = config.icon;

    const handleCopyHash = async () => {
        await navigator.clipboard.writeText(entry.dafny_content_hash);
        setHashCopied(true);
        setTimeout(() => setHashCopied(false), 2000);
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const truncateHash = (hash: string) => {
        if (hash.length <= 16) return hash;
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    return (
        <Card className={`p-4 ${isLatest ? 'border-primary' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <StatusIcon className={`h-5 w-5 mt-0.5 ${config.className}`} />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">
                                    {config.label}
                                    {isLatest && (
                                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                            Latest
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(entry.timestamp)}
                                </p>
                            </div>
                        </div>

                        <div className="text-sm space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Hash:</span>
                                <div className="flex items-center space-x-1">
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {truncateHash(entry.dafny_content_hash)}
                                    </code>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={handleCopyHash}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {hashCopied ? 'Copied!' : 'Copy full hash'}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Obligations:</span>
                                <span className="font-medium">
                                    {entry.proof_obligations_proven} / {entry.proof_obligations_total}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Entry:</span>
                                <span className="font-mono text-xs">#{entry.entry_number}</span>
                            </div>
                        </div>

                        {expanded && (
                            <div className="pt-2 mt-2 border-t text-sm space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Dafny Version:</span>
                                    <span className="font-mono text-xs">{entry.dafny_version}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Entry ID:</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {entry.entry_id.substring(0, 12)}...
                                    </code>
                                </div>
                                {entry.previous_hash && (
                                    <div className="flex items-start justify-between">
                                        <span className="text-muted-foreground">Previous Hash:</span>
                                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                            {truncateHash(entry.previous_hash)}
                                        </code>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                    {onViewDiff && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => onViewDiff(entry.entry_id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <FileSearch className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View code diff</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <Button
                        onClick={() => setExpanded(!expanded)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                                expanded ? 'rotate-90' : ''
                            }`}
                        />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
