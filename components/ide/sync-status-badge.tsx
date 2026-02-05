"use client";

import { CheckCircle2, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import type { SyncStatus } from "@/lib/types";

export interface SyncStatusBadgeProps {
    status: SyncStatus;
    className?: string;
}

const statusConfig = {
    synchronized: {
        icon: CheckCircle2,
        label: "Synchronized",
        className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    desynchronized: {
        icon: AlertTriangle,
        label: "Desynchronized",
        className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    verifying: {
        icon: RefreshCw,
        label: "Verifying",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    error: {
        icon: XCircle,
        label: "Error",
        className: "bg-destructive/10 text-destructive border-destructive/20",
    },
};

export function SyncStatusBadge({ status, className = "" }: SyncStatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${config.className} ${className}`}
        >
            <Icon className={`h-3.5 w-3.5 ${status === 'verifying' ? 'animate-spin' : ''}`} />
            <span>{config.label}</span>
        </div>
    );
}
