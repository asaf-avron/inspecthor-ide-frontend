"use client";

import { CheckCircle2, ShieldAlert, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProofObligation {
  id: string;
  name: string;
  location: string;
  status: "verified" | "failed" | "pending" | "warning";
  time?: string;
  details?: string;
}

const proofObligations: ProofObligation[] = [
  {
    id: "1",
    name: "ValidState: predicate well-formed",
    location: "Spec.dfy:15",
    status: "verified",
    time: "0.12s",
    details: "Predicate ValidState has been verified to be well-formed. All referenced fields exist and type constraints are satisfied.",
  },
  {
    id: "2",
    name: "Transfer: precondition satisfiability",
    location: "Spec.dfy:22",
    status: "verified",
    time: "0.08s",
    details: "The preconditions for the Transfer method are satisfiable. There exist valid inputs that can satisfy all requires clauses.",
  },
  {
    id: "3",
    name: "Transfer: postcondition ValidState",
    location: "Spec.dfy:28",
    status: "failed",
    time: "1.24s",
    details: "Cannot verify that ValidState(newState) holds after Transfer. The solver found a potential counterexample where the sum of balances may not equal totalSupply when 'to' address is not in the original balances map.",
  },
  {
    id: "4",
    name: "Transfer: postcondition balance update",
    location: "Spec.dfy:29",
    status: "verified",
    time: "0.31s",
    details: "Verified that the balance update postcondition holds: newState.balances[to] equals the old balance plus the transfer amount.",
  },
  {
    id: "5",
    name: "TransferPreservesTotalSupply: lemma body",
    location: "Spec.dfy:44",
    status: "verified",
    time: "0.89s",
    details: "The lemma body has been verified. The calculational proof correctly establishes that total supply is preserved.",
  },
  {
    id: "6",
    name: "Overflow check: fromBalance - amount",
    location: "Spec.dfy:35",
    status: "warning",
    time: "0.05s",
    details: "Potential underflow detected. While the precondition guards against this, consider adding an explicit assertion for documentation.",
  },
  {
    id: "7",
    name: "Overflow check: toBalance + amount",
    location: "Spec.dfy:36",
    status: "pending",
    details: "Pending verification. This check requires additional solver time due to complex arithmetic constraints.",
  },
];

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
};

export function VerificationPanel() {
  const verifiedCount = proofObligations.filter(p => p.status === "verified").length;
  const failedCount = proofObligations.filter(p => p.status === "failed").length;
  const pendingCount = proofObligations.filter(p => p.status === "pending").length;
  const warningCount = proofObligations.filter(p => p.status === "warning").length;

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Summary Header */}
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Proof Obligations</h3>
            <span className="text-xs text-muted-foreground">{proofObligations.length} total</span>
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
        </div>

        {/* Proof List */}
        <div className="flex-1 overflow-auto">
          {proofObligations.map((proof) => {
            const config = statusConfig[proof.status];
            const Icon = config.icon;

            return (
              <Tooltip key={proof.id}>
                <TooltipTrigger asChild>
                  <button className="group flex w-full items-start gap-2 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/50">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.className}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">
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
                <TooltipContent side="left" className="max-w-[300px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.className}`} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                    {proof.details && (
                      <p className="border-t border-border pt-2 text-xs">{proof.details}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
