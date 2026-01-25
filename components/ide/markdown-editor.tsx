"use client";

import { FileText, ChevronRight, Sparkles, ArrowRight, Hash, List, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkdownEditorProps {
  onGenerateSpec: () => void;
  isGenerating?: boolean;
}

const markdownContent = `# Token Approval Contract Requirements

## Overview
This document specifies the formal requirements for a secure ERC-20 style token approval system. The specification must be verifiable using Dafny.

---

## Functional Requirements

### FR-1: Transfer Operations
- **FR-1.1**: Users MUST be able to transfer tokens from their own balance to another address
- **FR-1.2**: Transfers MUST fail if the sender has insufficient balance
- **FR-1.3**: Transfers to the zero address MUST be prohibited

### FR-2: Approval Mechanism  
- **FR-2.1**: Token holders MUST be able to approve third parties to spend on their behalf
- **FR-2.2**: Approved spending MUST be limited to the approved amount
- **FR-2.3**: Multiple approvals for different spenders MUST be independent

### FR-3: TransferFrom Operations
- **FR-3.1**: Approved spenders MUST be able to transfer tokens within their allowance
- **FR-3.2**: TransferFrom MUST decrement the allowance by the transferred amount
- **FR-3.3**: TransferFrom MUST fail if allowance is exceeded

---

## Security Invariants

### SI-1: Conservation of Tokens
> **Critical**: The total supply of tokens MUST remain constant across all operations.
> 
> $$\\sum_{addr} balance[addr] = totalSupply$$

### SI-2: No Negative Balances
All balances MUST be non-negative at all times.

### SI-3: No Overflow
All arithmetic operations MUST be checked for overflow conditions.

---

## Formal Properties

| Property | Description | Priority |
|----------|-------------|----------|
| \`TotalSupplyConservation\` | Sum of balances equals total supply | P0 |
| \`NoNegativeBalance\` | All balances >= 0 | P0 |
| \`AllowanceRespected\` | TransferFrom <= allowance | P1 |
| \`TransferDecrementsSource\` | Sender balance decreases by exact amount | P1 |

---

## Notes
- This specification will be translated to Dafny formal verification code
- All properties marked P0 are **blocking** for deployment
- See \`spec.dfy\` for the formal implementation`;

export function MarkdownEditor({ onGenerateSpec, isGenerating }: MarkdownEditorProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-secondary/30">
        <div className="flex items-center">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span>requirements.md</span>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="pr-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onGenerateSpec}
                  disabled={isGenerating}
                  size="sm"
                  className="h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-primary px-3 text-xs font-medium text-white hover:from-violet-500/90 hover:to-primary/90"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`} />
                  <span>{isGenerating ? "Generating..." : "Generate Formal Spec"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Transform requirements into verifiable Dafny specification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
        <span>contracts</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">requirements.md</span>
      </div>

      {/* Toolbar */}
      <div className="flex h-8 items-center gap-1 border-b border-border bg-secondary/10 px-3">
        <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Hash className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <List className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <CheckSquare className="h-3.5 w-3.5" />
        </button>
        <div className="mx-2 h-4 w-px bg-border" />
        <span className="text-[10px] text-muted-foreground">Markdown Preview</span>
      </div>

      {/* Markdown Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <article className="prose prose-invert prose-sm max-w-none">
            {/* Title */}
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
              Token Approval Contract Requirements
            </h1>

            {/* Overview */}
            <section className="mb-6">
              <h2 className="mb-2 mt-6 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs text-primary">
                  1
                </span>
                Overview
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This document specifies the formal requirements for a secure ERC-20 style token approval system. 
                The specification must be verifiable using Dafny.
              </p>
            </section>

            <hr className="my-6 border-border" />

            {/* Functional Requirements */}
            <section className="mb-6">
              <h2 className="mb-4 mt-6 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs text-primary">
                  2
                </span>
                Functional Requirements
              </h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">FR-1: Transfer Operations</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span><strong className="text-foreground">FR-1.1</strong>: Users MUST be able to transfer tokens from their own balance to another address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span><strong className="text-foreground">FR-1.2</strong>: Transfers MUST fail if the sender has insufficient balance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span><strong className="text-foreground">FR-1.3</strong>: Transfers to the zero address MUST be prohibited</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">FR-2: Approval Mechanism</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span><strong className="text-foreground">FR-2.1</strong>: Token holders MUST be able to approve third parties to spend on their behalf</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span><strong className="text-foreground">FR-2.2</strong>: Approved spending MUST be limited to the approved amount</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span><strong className="text-foreground">FR-2.3</strong>: Multiple approvals for different spenders MUST be independent</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">FR-3: TransferFrom Operations</h3>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span><strong className="text-foreground">FR-3.1</strong>: Approved spenders MUST be able to transfer tokens within their allowance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span><strong className="text-foreground">FR-3.2</strong>: TransferFrom MUST decrement the allowance by the transferred amount</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span><strong className="text-foreground">FR-3.3</strong>: TransferFrom MUST fail if allowance is exceeded</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="my-6 border-border" />

            {/* Security Invariants */}
            <section className="mb-6">
              <h2 className="mb-4 mt-6 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-destructive/20 text-xs text-destructive">
                  !
                </span>
                Security Invariants
              </h2>

              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <h3 className="mb-2 text-sm font-medium text-foreground">SI-1: Conservation of Tokens</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  <strong className="text-destructive">Critical</strong>: The total supply of tokens MUST remain constant across all operations.
                </p>
                <div className="rounded bg-background/50 p-3 font-mono text-sm text-foreground">
                  {"∑"}<sub>addr</sub> balance[addr] = totalSupply
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-1 text-sm font-medium text-foreground">SI-2: No Negative Balances</h3>
                  <p className="text-xs text-muted-foreground">All balances MUST be non-negative at all times.</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="mb-1 text-sm font-medium text-foreground">SI-3: No Overflow</h3>
                  <p className="text-xs text-muted-foreground">All arithmetic operations MUST be checked for overflow conditions.</p>
                </div>
              </div>
            </section>

            <hr className="my-6 border-border" />

            {/* Formal Properties Table */}
            <section className="mb-6">
              <h2 className="mb-4 mt-6 flex items-center gap-2 text-lg font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs text-primary">
                  3
                </span>
                Formal Properties
              </h2>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-2 text-left font-medium text-foreground">Property</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Description</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="bg-background">
                      <td className="px-4 py-2 font-mono text-xs text-primary">TotalSupplyConservation</td>
                      <td className="px-4 py-2 text-muted-foreground">Sum of balances equals total supply</td>
                      <td className="px-4 py-2"><span className="rounded bg-destructive/20 px-1.5 py-0.5 text-xs font-medium text-destructive">P0</span></td>
                    </tr>
                    <tr className="bg-secondary/20">
                      <td className="px-4 py-2 font-mono text-xs text-primary">NoNegativeBalance</td>
                      <td className="px-4 py-2 text-muted-foreground">All balances {">="} 0</td>
                      <td className="px-4 py-2"><span className="rounded bg-destructive/20 px-1.5 py-0.5 text-xs font-medium text-destructive">P0</span></td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-4 py-2 font-mono text-xs text-primary">AllowanceRespected</td>
                      <td className="px-4 py-2 text-muted-foreground">TransferFrom {"<="} allowance</td>
                      <td className="px-4 py-2"><span className="rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">P1</span></td>
                    </tr>
                    <tr className="bg-secondary/20">
                      <td className="px-4 py-2 font-mono text-xs text-primary">TransferDecrementsSource</td>
                      <td className="px-4 py-2 text-muted-foreground">Sender balance decreases by exact amount</td>
                      <td className="px-4 py-2"><span className="rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">P1</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Notes */}
            <section className="rounded-lg border border-border bg-secondary/20 p-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">Notes</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• This specification will be translated to Dafny formal verification code</li>
                <li>• All properties marked P0 are <strong className="text-destructive">blocking</strong> for deployment</li>
                <li>• See <code className="rounded bg-background px-1 py-0.5 text-primary">spec.dfy</code> for the formal implementation</li>
              </ul>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
