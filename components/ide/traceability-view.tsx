"use client";

import { useState, useCallback } from "react";
import { FileText, ChevronRight, GripVertical, Eye, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TraceabilityViewProps {
  selectedFile: string;
  activeReference: string | null;
  onReferenceClick: (refId: string | null) => void;
}

interface ReferenceMapping {
  id: string;
  markdownText: string;
  dafnyLines: { start: number; end: number };
  dafnyCode: string;
}

const referenceMappings: ReferenceMapping[] = [
  {
    id: "Ref-1",
    markdownText: "Users MUST be able to transfer tokens from their own balance",
    dafnyLines: { start: 21, end: 35 },
    dafnyCode: `method Transfer(
    from: address, 
    to: address, 
    amount: uint256
  ) returns (newState: TokenState)
    requires ValidState(state)
    requires from in state.balances
    requires state.balances[from] >= amount
    ensures ValidState(newState)`,
  },
  {
    id: "Ref-2",
    markdownText: "Total supply of tokens MUST remain constant",
    dafnyLines: { start: 38, end: 52 },
    dafnyCode: `lemma TransferPreservesTotalSupply(
    s: TokenState, 
    from: address, 
    to: address, 
    amount: uint256
  )
    requires ValidState(s)
    ensures SumBalances(...) == s.totalSupply`,
  },
  {
    id: "Ref-3",
    markdownText: "All balances MUST be non-negative at all times",
    dafnyLines: { start: 11, end: 17 },
    dafnyCode: `predicate ValidState(s: TokenState)
  {
    // No negative or overflow values
    forall addr :: addr in s.balances ==> 
      0 <= s.balances[addr] <= MAX_UINT256
  }`,
  },
  {
    id: "Ref-4",
    markdownText: "Transfers MUST fail if the sender has insufficient balance",
    dafnyLines: { start: 26, end: 27 },
    dafnyCode: `requires from in state.balances
    requires state.balances[from] >= amount`,
  },
];

const dafnyCode = `// Spec.dfy - Token Approval Contract Specification
include "Utils.dfy"

module TokenApproval {
  datatype TokenState = TokenState(
    balances: map<address, uint256>,
    allowances: map<address, map<address, uint256>>,
    totalSupply: uint256
  )

  predicate ValidState(s: TokenState)
  {
    // Total supply equals sum of all balances
    SumBalances(s.balances) == s.totalSupply &&
    // No negative or overflow values
    forall addr :: addr in s.balances ==> 
      0 <= s.balances[addr] <= MAX_UINT256
  }

  method Transfer(
    from: address, 
    to: address, 
    amount: uint256
  ) returns (newState: TokenState)
    requires ValidState(state)
    requires from in state.balances
    requires state.balances[from] >= amount
    ensures ValidState(newState)
    ensures newState.balances[to] == 
      old(state.balances[to]) + amount
  {
    // Implementation verified against spec
    var fromBalance := state.balances[from];
    var toBalance := state.balances.GetOrDefault(to, 0);
    
    newState := state.(
      balances := state.balances
        [from := fromBalance - amount]
        [to := toBalance + amount]
    );
  }

  lemma TransferPreservesTotalSupply(
    s: TokenState, 
    from: address, 
    to: address, 
    amount: uint256
  )
    requires ValidState(s)
    requires from in s.balances
    requires s.balances[from] >= amount
    ensures SumBalances(Transfer(s, from, to, amount).balances) 
      == s.totalSupply
  {
    // Proof: conservation of tokens
    calc {
      SumBalances(Transfer(s, from, to, amount).balances);
      == { SumBalancesAdditive(s.balances, from, to, amount); }
      SumBalances(s.balances);
      == s.totalSupply;
    }
  }
}`;

const codeLines = dafnyCode.split("\n");

function ReferenceBadge({ 
  refId, 
  isActive, 
  onClick,
  mapping
}: { 
  refId: string; 
  isActive: boolean; 
  onClick: () => void;
  mapping: ReferenceMapping;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "ml-2 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
            isActive 
              ? "bg-blue-500/30 text-blue-300 ring-1 ring-blue-400/50" 
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          )}
        >
          <Bookmark className="h-2.5 w-2.5" />
          {refId}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-80 p-0">
        <div className="border-b border-border bg-secondary/50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Eye className="h-3.5 w-3.5 text-blue-400" />
            Quick Preview: {refId}
          </div>
        </div>
        <div className="p-3">
          <pre className="overflow-auto rounded bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground">
            {mapping.dafnyCode}
          </pre>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Lines {mapping.dafnyLines.start}-{mapping.dafnyLines.end} in Spec.dfy
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TraceabilityView({ 
  selectedFile, 
  activeReference, 
  onReferenceClick 
}: TraceabilityViewProps) {
  const activeMapping = referenceMappings.find(m => m.id === activeReference);

  return (
    <div className="flex h-full w-full">
      {/* Left Pane - Markdown with References */}
      <div className="flex w-1/2 flex-col border-r border-border">
        {/* Tab Bar */}
        <div className="flex h-9 items-center border-b border-border bg-secondary/30">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span>Requirements.md</span>
          </div>
          <span className="ml-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
            Trace Mode
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
          <span>Root Spec</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Requirements.md</span>
        </div>

        {/* Markdown Content with References */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-6 py-6">
            <article className="text-sm leading-relaxed">
              <h1 className="mb-4 text-xl font-semibold text-foreground">
                Token Approval Contract Requirements
              </h1>

              <section className="mb-6">
                <h2 className="mb-3 text-base font-medium text-foreground">
                  Functional Requirements
                </h2>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h3 className="mb-2 text-sm font-medium text-foreground">FR-1: Transfer Operations</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex flex-wrap items-center gap-1">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 self-start rounded-full bg-primary" />
                        <span><strong className="text-foreground">FR-1.1</strong>: Users MUST be able to transfer tokens from their own balance to another address</span>
                        <ReferenceBadge 
                          refId="Ref-1" 
                          isActive={activeReference === "Ref-1"} 
                          onClick={() => onReferenceClick(activeReference === "Ref-1" ? null : "Ref-1")}
                          mapping={referenceMappings[0]}
                        />
                      </li>
                      <li className="flex flex-wrap items-center gap-1">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 self-start rounded-full bg-primary" />
                        <span><strong className="text-foreground">FR-1.2</strong>: Transfers MUST fail if the sender has insufficient balance</span>
                        <ReferenceBadge 
                          refId="Ref-4" 
                          isActive={activeReference === "Ref-4"} 
                          onClick={() => onReferenceClick(activeReference === "Ref-4" ? null : "Ref-4")}
                          mapping={referenceMappings[3]}
                        />
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span><strong className="text-foreground">FR-1.3</strong>: Transfers to the zero address MUST be prohibited</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="mb-3 text-base font-medium text-foreground">
                  Security Invariants
                </h2>

                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">SI-1: Conservation of Tokens</h3>
                  <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    <strong className="text-destructive">Critical</strong>: The total supply of tokens MUST remain constant across all operations.
                    <ReferenceBadge 
                      refId="Ref-2" 
                      isActive={activeReference === "Ref-2"} 
                      onClick={() => onReferenceClick(activeReference === "Ref-2" ? null : "Ref-2")}
                      mapping={referenceMappings[1]}
                    />
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">SI-2: No Negative Balances</h3>
                  <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    All balances MUST be non-negative at all times.
                    <ReferenceBadge 
                      refId="Ref-3" 
                      isActive={activeReference === "Ref-3"} 
                      onClick={() => onReferenceClick(activeReference === "Ref-3" ? null : "Ref-3")}
                      mapping={referenceMappings[2]}
                    />
                  </p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
      </div>

      {/* Right Pane - Dafny Code */}
      <div className="flex w-1/2 flex-col">
        {/* Tab Bar */}
        <div className="flex h-9 items-center border-b border-border bg-secondary/30">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <div className="h-3.5 w-3.5 rounded bg-primary/80" />
            <span>Spec.dfy</span>
          </div>
          {activeMapping && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              Showing: {activeMapping.id} (Lines {activeMapping.dafnyLines.start}-{activeMapping.dafnyLines.end})
            </span>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
          <span>Root Spec</span>
          <ChevronRight className="h-3 w-3" />
          <span>Auth.dfy</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Spec.dfy</span>
        </div>

        {/* Code Area */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-max font-mono text-[13px] leading-5">
            {/* Line Numbers */}
            <div className="sticky left-0 flex flex-col bg-background pr-2 text-right text-muted-foreground/60 select-none">
              {codeLines.map((_, i) => {
                const lineNum = i + 1;
                const isHighlighted = activeMapping && 
                  lineNum >= activeMapping.dafnyLines.start && 
                  lineNum <= activeMapping.dafnyLines.end;
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "px-3",
                      isHighlighted && "bg-blue-500/20 text-blue-400"
                    )}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>

            {/* Code Content */}
            <div className="flex-1 pl-2">
              <pre className="text-foreground">
                {codeLines.map((line, i) => {
                  const lineNum = i + 1;
                  const isHighlighted = activeMapping && 
                    lineNum >= activeMapping.dafnyLines.start && 
                    lineNum <= activeMapping.dafnyLines.end;
                  const isCollapsed = activeMapping && 
                    (lineNum < activeMapping.dafnyLines.start - 2 || 
                     lineNum > activeMapping.dafnyLines.end + 2);
                  
                  // Show collapsed indicator
                  if (activeMapping && isCollapsed) {
                    // Show collapse indicator at start and end boundaries
                    if (lineNum === 1 || lineNum === activeMapping.dafnyLines.end + 3) {
                      return (
                        <div key={i} className="text-muted-foreground/50 italic">
                          {"  "}...
                        </div>
                      );
                    }
                    return null;
                  }

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        isHighlighted 
                          ? "bg-blue-500/20 ring-1 ring-inset ring-blue-500/30" 
                          : "hover:bg-accent/30"
                      )}
                    >
                      <CodeLine line={line} />
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeLine({ line }: { line: string }) {
  const highlightedLine = line
    .replace(/(\/\/.*$)/g, '<span class="text-muted-foreground/70">$1</span>')
    .replace(/\b(module|datatype|predicate|method|lemma|returns|requires|ensures|forall|calc|include|var)\b/g, '<span class="text-[#c586c0]">$1</span>')
    .replace(/\b(map|uint256|address|bool|TokenState)\b/g, '<span class="text-[#4ec9b0]">$1</span>')
    .replace(/\b(true|false|old|in)\b/g, '<span class="text-[#569cd6]">$1</span>')
    .replace(/(".*?")/g, '<span class="text-[#ce9178]">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>');

  return (
    <code dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }} />
  );
}
