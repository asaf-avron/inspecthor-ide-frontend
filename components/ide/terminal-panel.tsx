"use client";

import { useEffect, useRef } from "react";
import { Terminal, X, Maximize2, Minus, Trash2 } from "lucide-react";
import { useProject } from "@/lib/project-context";
import type { LogEntry } from "@/lib/types";

const levelColors: Record<LogEntry['level'], string> = {
  info: "text-muted-foreground",
  debug: "text-muted-foreground/70",
  success: "text-primary",
  error: "text-destructive",
  warn: "text-warning",
};

const levelPrefixes: Record<LogEntry['level'], string> = {
  info: "",
  debug: "",
  success: "✓ ",
  error: "✗ ",
  warn: "⚠ ",
};

interface TerminalPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isGenerating?: boolean;
  height?: number; // Height in pixels when not collapsed
  isResizing?: boolean; // Whether currently being resized
}

export function TerminalPanel({ isCollapsed, onToggle, isGenerating, height = 192, isResizing = false }: TerminalPanelProps) {
  const { state, clearLogs, addLog } = useProject();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.logs, isCollapsed]);

  // Add welcome message if no logs
  useEffect(() => {
    if (state.logs.length === 0 && state.hasProject) {
      addLog('info', 'Inspecthor IDE initialized');
      addLog('info', 'Ready for specification generation');
    }
  }, [state.hasProject, state.logs.length, addLog]);

  const handleClear = () => {
    clearLogs();
    addLog('info', 'Terminal cleared');
  };

  return (
    <div 
      className={`flex flex-col border-t border-border bg-background ${isCollapsed ? "h-9 transition-all" : isResizing ? "" : "transition-all"}`}
      style={!isCollapsed && height ? { height: `${height}px` } : undefined}
    >
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-secondary/30 px-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Terminal</span>
          <span className="text-xs text-muted-foreground">
            — {isGenerating ? 'Generating...' : state.isVerifying ? 'Verifying...' : 'Output'}
          </span>
          {(isGenerating || state.isVerifying) && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={isCollapsed ? "Expand" : "Collapse"}
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
          {state.logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground/50">
              No output yet. Generate a spec or run verification to see logs.
            </div>
          ) : (
            state.logs.map((entry, i) => (
              <div key={i} className="flex gap-2 leading-5">
                <span className="shrink-0 text-muted-foreground/50">[{entry.time}]</span>
                <span className={levelColors[entry.level]}>
                  {levelPrefixes[entry.level]}{entry.message}
                </span>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {(isGenerating || state.isVerifying) && (
            <div className="flex gap-2 leading-5">
              <span className="shrink-0 text-muted-foreground/50">[...]</span>
              <span className="animate-pulse text-muted-foreground">
                {isGenerating ? 'Processing specification...' : 'Running Dafny verifier...'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
