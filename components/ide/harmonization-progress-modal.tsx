"use client";

import { CheckCircle2, Loader2, Circle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface HarmonizationProgressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    steps: string[];
    currentStep: number;
}

export function HarmonizationProgressModal({
    open,
    onOpenChange,
    steps,
    currentStep,
}: HarmonizationProgressModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Harmonizing...</DialogTitle>
                    <DialogDescription>
                        Synchronizing specification, logic, and implementation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isPending = index > currentStep;

                        return (
                            <div
                                key={index}
                                className="flex items-center space-x-3"
                            >
                                {isCompleted && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                )}
                                {isCurrent && (
                                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                                )}
                                {isPending && (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                    className={`text-sm ${
                                        isCompleted
                                            ? "text-muted-foreground"
                                            : isCurrent
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {index + 1}. {step}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {currentStep >= steps.length && (
                    <div className="flex items-center justify-center space-x-2 text-green-600 py-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Harmonization complete!</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
