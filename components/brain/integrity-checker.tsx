"use client";

import { useState } from "react";
import { Shield, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IntegrityCheckerProps {
    componentUuid: string;
    chainValid: boolean;
    onCheck: () => Promise<void>;
    className?: string;
}

export function IntegrityChecker({
    componentUuid,
    chainValid,
    onCheck,
    className,
}: IntegrityCheckerProps) {
    const [checking, setChecking] = useState(false);

    const handleCheck = async () => {
        setChecking(true);
        try {
            await onCheck();
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className={cn("flex items-center justify-between", className)}>
            <div className="flex items-center space-x-2">
                {chainValid ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                            Cryptographic chain verified
                        </span>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                            Chain integrity compromised
                        </span>
                    </>
                )}
            </div>
            <Button
                onClick={handleCheck}
                variant="outline"
                size="sm"
                disabled={checking}
            >
                <Shield className={`h-4 w-4 mr-2 ${checking ? 'animate-pulse' : ''}`} />
                {checking ? 'Checking...' : 'Check Integrity'}
            </Button>
        </div>
    );
}
