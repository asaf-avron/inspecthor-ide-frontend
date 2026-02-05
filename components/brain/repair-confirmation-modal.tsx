"use client";

import { AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface RepairConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    issuesCount: number;
    onConfirm: () => void;
}

export function RepairConfirmationModal({
    open,
    onOpenChange,
    issuesCount,
    onConfirm,
}: RepairConfirmationModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span>Auto-Repair All Issues?</span>
                    </DialogTitle>
                    <DialogDescription>
                        This will attempt to automatically repair {issuesCount} drift{' '}
                        {issuesCount === 1 ? 'issue' : 'issues'}:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Moved components will have their registry updated</li>
                            <li>Corrupted components will be regenerated</li>
                            <li>Orphaned files may be registered or deleted</li>
                        </ul>
                        <p className="mt-3 font-semibold">This action cannot be undone.</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Confirm Repair
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
