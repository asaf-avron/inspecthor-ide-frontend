"use client";

import { useState, useEffect } from "react";
import { FileSearch, Folder, File, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { driftAPI } from "@/lib/api/drift";
import type { DriftIssue } from "@/lib/types";

export interface ManualRelinkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    issue: DriftIssue;
    repoPath: string;
    onRelink: (newPath: string) => Promise<void>;
}

export function ManualRelinkModal({
    open,
    onOpenChange,
    issue,
    repoPath,
    onRelink,
}: ManualRelinkModalProps) {
    const [selectedPath, setSelectedPath] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<"pending" | "valid" | "invalid">("pending");
    const [verificationMessage, setVerificationMessage] = useState("");
    const [relinking, setRelinking] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setSelectedPath("");
            setVerificationStatus("pending");
            setVerificationMessage("");
        }
    }, [open]);

    // Verify path when selected
    useEffect(() => {
        if (!selectedPath) {
            setVerificationStatus("pending");
            return;
        }

        const verify = async () => {
            setVerifying(true);
            try {
                const result = await driftAPI.verifyUuid(issue.uuid, selectedPath);
                setVerificationStatus(result.valid ? "valid" : "invalid");
                setVerificationMessage(result.message);
            } catch (err) {
                setVerificationStatus("invalid");
                setVerificationMessage(err instanceof Error ? err.message : "Verification failed");
            } finally {
                setVerifying(false);
            }
        };

        const debounce = setTimeout(verify, 500);
        return () => clearTimeout(debounce);
    }, [selectedPath, issue.uuid]);

    const handleRelink = async () => {
        if (verificationStatus !== "valid") return;

        setRelinking(true);
        try {
            await onRelink(selectedPath);
            onOpenChange(false);
        } catch (err) {
            // Error handled by parent
        } finally {
            setRelinking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <FileSearch className="h-5 w-5" />
                        <span>Manual Relink Component</span>
                    </DialogTitle>
                    <DialogDescription>
                        Component <code className="bg-muted px-1 rounded">{issue.component_name}</code>{' '}
                        (UUID: <code className="bg-muted px-1 rounded text-xs">{issue.uuid}</code>)
                        <br />
                        Expected path: <code className="bg-muted px-1 rounded text-xs">{issue.expected_path}</code>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Path Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Select new location:
                        </label>
                        <Input
                            value={selectedPath}
                            onChange={(e) => setSelectedPath(e.target.value)}
                            placeholder="/path/to/component.py"
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Verification Status */}
                    {selectedPath && (
                        <div className="rounded-lg border p-3">
                            <div className="flex items-center space-x-2">
                                {verifying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Verifying UUID...
                                        </span>
                                    </>
                                ) : verificationStatus === "valid" ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600">
                                            ✓ UUID verified in file
                                        </span>
                                    </>
                                ) : verificationStatus === "invalid" ? (
                                    <>
                                        <XCircle className="h-4 w-4 text-destructive" />
                                        <span className="text-sm text-destructive">
                                            {verificationMessage || "UUID not found in file"}
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* File Browser Placeholder */}
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-muted-foreground text-center">
                            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>File browser coming soon</p>
                            <p className="text-xs mt-1">For now, enter the file path manually above</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={relinking}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleRelink}
                        disabled={verificationStatus !== "valid" || relinking}
                    >
                        {relinking ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Relinking...
                            </>
                        ) : (
                            <>Relink Component</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
