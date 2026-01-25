"use client";

import { useEffect, useRef } from "react";
import { Terminal, X, Maximize2, Minus } from "lucide-react";

const logEntries = [
  { time: "14:32:01.234", level: "info", message: "Guardian Gateway v2.4.1 initialized" },
  { time: "14:32:01.456", level: "info", message: "Loading specification: contracts/token/Spec.dfy" },
  { time: "14:32:01.789", level: "info", message: "Parsing complete. 3 modules, 7 proof obligations." },
  { time: "14:32:02.012", level: "info", message: "Starting Z3 solver (version 4.12.2)..." },
  { time: "14:32:02.345", level: "debug", message: "Solver configuration: timeout=30s, memory=4096MB" },
  { time: "14:32:02.567", level: "info", message: "Verifying: ValidState predicate well-formedness" },
  { time: "14:32:02.689", level: "success", message: "✓ ValidState: verified (0.12s)" },
  { time: "14:32:02.890", level: "info", message: "Verifying: Transfer precondition satisfiability" },
  { time: "14:32:02.970", level: "success", message: "✓ Transfer preconditions: verified (0.08s)" },
  { time: "14:32:03.123", level: "info", message: "Verifying: Transfer postcondition ValidState(newState)" },
  { time: "14:32:04.234", level: "debug", message: "Solver query complexity: 847 clauses, 234 variables" },
  { time: "14:32:04.567", level: "error", message: "✗ Counterexample found for postcondition at line 28" },
  { time: "14:32:04.568", level: "error", message: "  → state.balances = { 0x1234: 100 }, to = 0x5678, amount = 50" },
  { time: "14:32:04.569", level: "error", message: "  → GetOrDefault returns 0 for absent key 0x5678" },
  { time: "14:32:04.570", level: "error", message: "  → SumBalances invariant cannot be established" },
  { time: "14:32:04.789", level: "info", message: "Verifying: Transfer postcondition balance update" },
  { time: "14:32:05.100", level: "success", message: "✓ Balance update postcondition: verified (0.31s)" },
  { time: "14:32:05.234", level: "info", message: "Verifying: TransferPreservesTotalSupply lemma" },
  { time: "14:32:06.123", level: "success", message: "✓ TransferPreservesTotalSupply: verified (0.89s)" },
  { time: "14:32:06.456", level: "warn", message: "⚠ Potential underflow at line 35 (assertion recommended)" },
  { time: "14:32:06.789", level: "info", message: "Verification complete: 4 passed, 1 failed, 1 warning, 1 pending" },
  { time: "14:32:06.790", level: "info", message: "Total time: 4.78s | Peak memory: 312MB" },
];

const levelColors: Record<string, string> = {
  info: "text-muted-foreground",
  debug: "text-muted-foreground/70",
  success: "text-primary",
  error: "text-destructive",
  warn: "text-warning",
};

interface TerminalPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function TerminalPanel({ isCollapsed, onToggle }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isCollapsed]);

  return (
    <div className={`flex flex-col border-t border-border bg-background transition-all ${isCollapsed ? "h-9" : "h-48"}`}>
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-secondary/30 px-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Terminal</span>
          <span className="text-xs text-muted-foreground">— Solver Output</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </button>
          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Log Content */}
      {!isCollapsed && (
        <div ref={scrollRef} className="flex-1 overflow-auto p-2 font-mono text-xs">
          {logEntries.map((entry, i) => (
            <div key={i} className="flex gap-2 leading-5">
              <span className="shrink-0 text-muted-foreground/50">[{entry.time}]</span>
              <span className={levelColors[entry.level]}>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
