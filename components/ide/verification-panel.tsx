"use client";

import { useMemo } from "react";
import { CheckCircle2, ShieldAlert, Clock, ChevronRight, AlertTriangle, Play, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";
import { useFileContext } from "@/lib/contexts/file-context";
import { useVerificationContext } from "@/lib/contexts/verification-context";
import type { ProofObligation } from "@/lib/types";

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    className: "text-primary",
    label: "Verified",
    description: "This proof obligation has been successfully verified by the SMT solver.",
  },
  failed: {
    icon: ShieldAlert,
    className: "text-destructive",
    label: "Invariant Failed",
    description: "Verification failed. The solver found a potential counterexample or could not prove the property.",
  },
  pending: {
    icon: Clock,
    className: "text-muted-foreground",
    label: "Pending",
    description: "Verification is queued and waiting for solver resources.",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-warning",
    label: "Warning",
    description: "Verification passed with warnings. Review recommended.",
  },
  timeout: {
    icon: Clock,
    className: "text-warning",
    label: "Timeout",
    description: "Verification timed out. Consider increasing timeout or simplifying the proof.",
  },
};

// Default proof obligations to show when no verification has run
const defaultProofObligations: ProofObligation[] = [
  {
    id: "0",
    name: "No verification results",
    location: "Run verification to see proof obligations",
    status: "pending",
    details: "Click 'Run Verification' in the header to verify the Dafny specification.",
  },
];

export function VerificationPanel() {
  const { state: projectState } = useProject();
  const { state: fileState } = useFileContext();
  const { state: verificationState, runVerification } = useVerificationContext();

  // Derive dafny code from active file
  const dafnyCode = fileState.activeFile?.fileType === 'dfy' ? fileState.activeFile.content : '';

  // Use proof obligations from context or show default
  const proofObligations = useMemo(() => {
    if (verificationState.proofObligations.length > 0) {
      return verificationState.proofObligations;
    }
    // If we have gaps from spec generation, show them as pending
    if (projectState.gaps.length > 0) {
      return projectState.gaps.map((gap, i) => ({
        id: gap.id || `gap-${i}`,
        name: gap.description,
        location: gap.location?.file || 'Spec.dfy',
        status: gap.severity === 'critical' ? 'failed' as const : 'warning' as const,
        details: gap.suggestion,
        time: undefined, // Gaps don't have timing info
      }));
    }
    return defaultProofObligations;
  }, [verificationState.proofObligations, projectState.gaps]);

  const verifiedCount = proofObligations.filter(p => p.status === "verified").length;
  const failedCount = proofObligations.filter(p => p.status === "failed").length;
  const pendingCount = proofObligations.filter(p => p.status === "pending").length;
  const warningCount = proofObligations.filter(p => p.status === "warning" || p.status === "timeout").length;

  const handleRunVerification = async () => {
    if (dafnyCode) {
      await runVerification(dafnyCode);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full min-w-0 flex-col">
        {/* Summary Header */}
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Proof Obligations</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{proofObligations.length} total</span>
              <Button
                onClick={handleRunVerification}
                disabled={verificationState.isVerifying || !dafnyCode}
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-xs"
              >
                {verificationState.isVerifying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {verificationState.isVerifying ? "Verifying..." : "Run"}
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">{verifiedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              <span className="text-muted-foreground">{failedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="text-muted-foreground">{warningCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{pendingCount}</span>
            </div>
          </div>

          {/* Verification Results Summary */}
          {verificationState.verificationResults && (
            <div className={`mt-2 rounded px-2 py-1 text-xs ${verificationState.verificationResults.verified
                ? "bg-primary/20 text-primary"
                : "bg-destructive/20 text-destructive"
              }`}>
              {verificationState.verificationResults.verified
                ? `Verification passed in ${verificationState.verificationResults.verification_time_ms}ms`
                : `Verification failed: ${verificationState.verificationResults.errors.length} errors`
              }
            </div>
          )}
        </div>

        {/* Proof List */}
        <div className="flex-1 overflow-auto">
          {proofObligations.map((proof) => {
            const config = statusConfig[proof.status] || statusConfig.pending;
            const Icon = config.icon;

            return (
              <Tooltip key={proof.id}>
                <TooltipTrigger asChild>
                  <button className="group flex w-full items-start gap-2 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/50">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.className}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="break-words text-xs font-medium text-foreground">
                          {proof.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{proof.location}</span>
                        {proof.time && (
                          <>
                            <span className="text-border">•</span>
                            <span>{proof.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[500px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 shrink-0 ${config.className}`} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground break-words">{config.description}</p>
                    {proof.details && (
                      <p className="border-t border-border pt-2 text-xs break-words whitespace-pre-wrap">{proof.details}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Errors Section */}
        {verificationState.verificationResults?.errors && verificationState.verificationResults.errors.length > 0 && (
          <div className="border-t border-border p-3">
            <h4 className="mb-2 text-xs font-medium text-destructive">Verification Errors</h4>
            <div className="space-y-2">
              {verificationState.verificationResults.errors.map((error, i) => (
                <div key={i} className="rounded bg-destructive/10 p-2 text-xs">
                  <div className="font-mono text-destructive">
                    Line {error.line}:{error.column}
                  </div>
                  <div className="mt-1 text-muted-foreground">{error.message}</div>
                  {error.suggestion && (
                    <div className="mt-1 text-primary">Suggestion: {error.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
