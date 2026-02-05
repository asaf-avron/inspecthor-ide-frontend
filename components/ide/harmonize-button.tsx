"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { harmonizationAPI } from "@/lib/api/harmonization";
import { HarmonizationProgressModal } from "./harmonization-progress-modal";
import type { SyncStatus, HarmonizationStrategy } from "@/lib/types";

export interface HarmonizeButtonProps {
    blueprintId: string;
    status: SyncStatus;
    disabled?: boolean;
    onComplete?: (newStatus: SyncStatus) => void;
}

export function HarmonizeButton({
    blueprintId,
    status,
    disabled,
    onComplete,
}: HarmonizeButtonProps) {
    const [harmonizing, setHarmonizing] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState(0);

    const isDesynchronized = status === "desynchronized";

    const handleHarmonize = async () => {
        if (!isDesynchronized || disabled) return;

        setHarmonizing(true);
        setShowProgress(true);
        setSteps([
            "Analyzing spec changes",
            "Updating Dafny logic",
            "Running verification",
            "Generating Python code",
            "Updating proof ledger",
        ]);
        setCurrentStep(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }, 2000);

        try {
            const result = await harmonizationAPI.harmonize({
                blueprint_id: blueprintId,
                strategy: "incremental",
            });

            clearInterval(progressInterval);
            setCurrentStep(5);

            if (result.success) {
                onComplete?.(result.status);
            }

            // Keep modal open briefly to show completion
            setTimeout(() => {
                setShowProgress(false);
            }, 1500);
        } catch (err) {
            clearInterval(progressInterval);
            // Handle error
        } finally {
            setHarmonizing(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleHarmonize}
                variant={isDesynchronized ? "default" : "outline"}
                size="sm"
                disabled={!isDesynchronized || disabled || harmonizing}
            >
                {harmonizing ? (
                    <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Harmonizing...
                    </>
                ) : isDesynchronized ? (
                    <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Harmonize Now
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Harmonize
                    </>
                )}
            </Button>

            <HarmonizationProgressModal
                open={showProgress}
                onOpenChange={setShowProgress}
                steps={steps}
                currentStep={currentStep}
            />
        </>
    );
}
