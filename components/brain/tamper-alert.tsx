"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface TamperAlertProps {
    errors: string[];
    className?: string;
}

export function TamperAlert({ errors, className }: TamperAlertProps) {
    if (errors.length === 0) return null;

    return (
        <Alert variant="destructive" className={cn(className)}>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Tamper Detection Warning</AlertTitle>
            <AlertDescription>
                <p className="mb-2">
                    The cryptographic proof chain has been compromised. This may indicate
                    unauthorized modifications to the verified code.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
                <p className="mt-2 text-sm font-semibold">
                    Action required: Review the code changes and re-verify.
                </p>
            </AlertDescription>
        </Alert>
    );
}
