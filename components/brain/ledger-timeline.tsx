"use client";

import { LedgerEntry } from "@/lib/types";
import { LedgerEntryCard } from "./ledger-entry-card";

export interface LedgerTimelineProps {
    entries: LedgerEntry[];
    onViewDiff?: (entryId: string) => void;
}

export function LedgerTimeline({ entries, onViewDiff }: LedgerTimelineProps) {
    return (
        <div className="space-y-4 overflow-y-auto flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Timeline
            </h3>
            <div className="space-y-3">
                {entries.map((entry, index) => (
                    <LedgerEntryCard
                        key={entry.entry_id}
                        entry={entry}
                        isLatest={index === 0}
                        onViewDiff={onViewDiff}
                    />
                ))}
            </div>
        </div>
    );
}
