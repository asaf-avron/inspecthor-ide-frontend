"use client";

import { useMemo } from "react";
import { FileText, ChevronRight, GripVertical, Eye, Bookmark, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProject } from "@/lib/project-context";
import type { ReferenceMapping } from "@/lib/types";

interface TraceabilityViewProps {
  selectedFile: string;
  activeReference: string | null;
  onReferenceClick: (refId: string | null) => void;
}

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

function CodeLine({ line }: { line: string }) {
  // Using CSS variables for theme-aware syntax highlighting
  const highlightedLine = line
    .replace(/(\/\/.*$)/g, '<span class="text-syntax-comment">$1</span>')
    .replace(/\b(module|datatype|predicate|method|lemma|function|returns|requires|ensures|forall|exists|calc|include|var|if|else|while|match|case|ghost|class|trait|type|const)\b/g, '<span class="text-syntax-keyword">$1</span>')
    .replace(/\b(map|seq|set|multiset|array|int|nat|real|bool|string|char|object)\b/g, '<span class="text-syntax-type">$1</span>')
    .replace(/\b(true|false|null|old|fresh|in|this)\b/g, '<span class="text-syntax-function">$1</span>')
    .replace(/(".*?")/g, '<span class="text-syntax-string">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-syntax-number">$1</span>');

  return (
    <code dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }} />
  );
}

export function TraceabilityView({ 
  selectedFile, 
  activeReference, 
  onReferenceClick 
}: TraceabilityViewProps) {
  const { state } = useProject();
  
  // Get mappings from context or use empty array
  const referenceMappings = useMemo(() => {
    if (state.referenceMappings.length > 0) {
      return state.referenceMappings;
    }
    // Convert traceability matrix if available
    if (state.traceabilityMatrix.length > 0) {
      return state.traceabilityMatrix.map((entry, i) => ({
        id: entry.id || `REF-${i + 1}`,
        markdownText: entry.source_text,
        dafnyLines: { 
          start: entry.line_number || 1, 
          end: (entry.line_number || 1) + 5 
        },
        dafnyCode: entry.code_line,
      }));
    }
    return [];
  }, [state.referenceMappings, state.traceabilityMatrix]);

  const activeMapping = referenceMappings.find(m => m.id === activeReference);
  
  // Use dafny code from context
  const dafnyCode = state.dafnyCode || defaultDafnyCode;
  const codeLines = dafnyCode.split("\n");

  // Parse markdown content to extract requirements for display
  const markdownContent = state.markdownContent || state.structuredSpec || '';

  // Check if we have any data
  const hasData = referenceMappings.length > 0 || state.dafnyCode;

  if (!hasData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No Traceability Data</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate a formal specification from your requirements to see traceability mappings.
          </p>
        </div>
      </div>
    );
  }

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
          {state.statistics && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              {state.statistics.coverage_percentage.toFixed(0)}% coverage
            </span>
          )}
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
                Requirements Traceability
              </h1>

              {referenceMappings.length > 0 ? (
                <section className="mb-6">
                  <h2 className="mb-3 text-base font-medium text-foreground">
                    Mapped Requirements ({referenceMappings.length})
                  </h2>

                  <div className="space-y-4">
                    {referenceMappings.map((mapping, index) => (
                      <div key={mapping.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <div className="flex-1">
                            <span className="text-sm text-muted-foreground">
                              {mapping.markdownText}
                            </span>
                            <ReferenceBadge 
                              refId={mapping.id} 
                              isActive={activeReference === mapping.id} 
                              onClick={() => onReferenceClick(activeReference === mapping.id ? null : mapping.id)}
                              mapping={mapping}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No requirement mappings found. Generate a specification to create traceability links.
                </p>
              )}

              {/* Show gaps if any */}
              {state.gaps.length > 0 && (
                <section className="mt-6">
                  <h2 className="mb-3 text-base font-medium text-destructive">
                    Gaps ({state.gaps.length})
                  </h2>
                  <div className="space-y-2">
                    {state.gaps.map((gap) => (
                      <div 
                        key={gap.id} 
                        className={cn(
                          "rounded-lg border p-3 text-sm",
                          gap.severity === 'critical' 
                            ? "border-destructive/50 bg-destructive/10" 
                            : "border-warning/50 bg-warning/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            gap.severity === 'critical' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                          )}>
                            {gap.severity}
                          </span>
                          <span className="text-foreground">{gap.description}</span>
                        </div>
                        {gap.suggestion && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Suggestion: {gap.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
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

const defaultDafnyCode = `// spec.dfy - Generated Dafny Specification
// Generate a specification to see code here

module Specification {
  // Your specification will appear here
}
`;
