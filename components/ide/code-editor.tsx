"use client";

import { useState } from "react";
import { File, X, ChevronRight } from "lucide-react";

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

interface CodeEditorProps {
  selectedFile?: string;
}

export function CodeEditor({ selectedFile = "spec.dfy" }: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState(selectedFile === "utils.dfy" ? "Utils.dfy" : "Spec.dfy");

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex h-9 items-center border-b border-border bg-secondary/30">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("Spec.dfy")}
            className={`group flex h-9 items-center gap-2 border-r border-border px-3 text-xs ${
              activeTab === "Spec.dfy"
                ? "bg-background text-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <File className="h-3.5 w-3.5 text-primary" />
            <span>Spec.dfy</span>
            <X className="h-3 w-3 opacity-0 group-hover:opacity-60" />
          </button>
          <button
            onClick={() => setActiveTab("Utils.dfy")}
            className={`group flex h-9 items-center gap-2 border-r border-border px-3 text-xs ${
              activeTab === "Utils.dfy"
                ? "bg-background text-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <File className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Utils.dfy</span>
            <X className="h-3 w-3 opacity-0 group-hover:opacity-60" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
        <span>contracts</span>
        <ChevronRight className="h-3 w-3" />
        <span>token</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Spec.dfy</span>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max font-mono text-[13px] leading-5">
          {/* Line Numbers */}
          <div className="sticky left-0 flex flex-col bg-background pr-2 text-right text-muted-foreground/60 select-none">
            {codeLines.map((_, i) => (
              <div key={i} className="px-3">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 pl-2">
            <pre className="text-foreground">
              {codeLines.map((line, i) => (
                <div key={i} className="hover:bg-accent/30">
                  <CodeLine line={line} lineNumber={i + 1} />
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeLine({ line, lineNumber }: { line: string; lineNumber: number }) {
  // Highlight error line
  const isErrorLine = lineNumber === 32;
  
  // Simple syntax highlighting
  const highlightedLine = line
    .replace(/(\/\/.*$)/g, '<span class="text-muted-foreground/70">$1</span>')
    .replace(/\b(module|datatype|predicate|method|lemma|returns|requires|ensures|forall|calc|include|var)\b/g, '<span class="text-[#c586c0]">$1</span>')
    .replace(/\b(map|uint256|address|bool|TokenState)\b/g, '<span class="text-[#4ec9b0]">$1</span>')
    .replace(/\b(true|false|old|in)\b/g, '<span class="text-[#569cd6]">$1</span>')
    .replace(/(".*?")/g, '<span class="text-[#ce9178]">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>');

  return (
    <code 
      className={isErrorLine ? "bg-destructive/20 block" : ""}
      dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }} 
    />
  );
}
