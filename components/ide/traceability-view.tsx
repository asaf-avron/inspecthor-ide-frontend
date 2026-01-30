"use client";

import { useMemo } from "react";
import type React from "react";
import { FileText, ChevronRight, GripVertical, Eye, Bookmark, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProject } from "@/lib/project-context";
import type { ReferenceMapping, ProjectFileItem } from "@/lib/types";

interface TraceabilityViewProps {
  selectedFile: string;
  activeReference: string | null;
  onReferenceClick: (refId: string | null) => void;
  leftPaneWidth?: number; // Percentage width for left pane (default 50)
  isResizing?: boolean;
  onResizeStart?: (e: React.MouseEvent) => void;
  projectFiles?: ProjectFileItem[]; // File tree for breadcrumbs
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
              ? "bg-info/30 text-info ring-1 ring-info/50"
              : "bg-info-muted text-info hover:bg-info/30"
          )}
        >
          <Bookmark className="h-2.5 w-2.5" />
          {refId}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-80 p-0">
        <div className="border-b border-border bg-secondary/50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Eye className="h-3.5 w-3.5 text-info" />
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
  // Safe syntax highlighting using placeholders to prevent regex collisions
  const placeholders: string[] = [];
  const encode = (str: string, cls: string) => {
    placeholders.push(`<span class='text-syntax-${cls}'>${str}</span>`);
    return `__PH_${placeholders.length - 1}__`;
  };

  let processed = line;

  // 1. Extract strings (Priority over comments to avoid // inside string)
  processed = processed.replace(/(".*?")/g, (match) => encode(match, 'string'));

  // 2. Extract comments
  processed = processed.replace(/(\/\/.*$)/g, (match) => encode(match, 'comment'));

  // 3. Highlight Keywords (now safe from colliding with strings/comments)
  processed = processed
    .replace(/\b(module|datatype|predicate|method|lemma|function|returns|requires|ensures|forall|exists|calc|include|var|if|else|while|match|case|ghost|class|trait|type|const)\b/g, "<span class='text-syntax-keyword'>$1</span>")
    .replace(/\b(map|seq|set|multiset|array|int|nat|real|bool|string|char|object)\b/g, "<span class='text-syntax-type'>$1</span>")
    .replace(/\b(true|false|null|old|fresh|in|this)\b/g, "<span class='text-syntax-function'>$1</span>")
    .replace(/\b(\d+)\b/g, "<span class='text-syntax-number'>$1</span>");

  // 4. Restore placeholders in REVERSE order (to handle nesting like strings inside comments)
  for (let i = placeholders.length - 1; i >= 0; i--) {
    processed = processed.replace(`__PH_${i}__`, placeholders[i]);
  }

  return (
    <code dangerouslySetInnerHTML={{ __html: processed || "&nbsp;" }} />
  );
}

export function TraceabilityView({
  selectedFile,
  activeReference,
  onReferenceClick,
  leftPaneWidth = 50,
  isResizing = false,
  onResizeStart,
  projectFiles = [],
}: TraceabilityViewProps) {
  const { state } = useProject();

  // Helper function to find path in project tree
  const findPath = (items: ProjectFileItem[], targetId: string, path: ProjectFileItem[] = []): ProjectFileItem[] | null => {
    for (const item of items) {
      const currentPath = [...path, item];

      if (item.id === targetId || item.file_id === targetId) {
        return currentPath;
      }

      if (item.children) {
        const found = findPath(item.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  // Build breadcrumb path for markdown file
  const markdownBreadcrumb = useMemo(() => {
    if (!projectFiles || !projectFiles.length) {
      return [];
    }

    // Find first markdown file in project tree
    const findMarkdownFile = (items: ProjectFileItem[]): ProjectFileItem | null => {
      for (const item of items) {
        if (item.type === 'md') {
          return item;
        }
        if (item.children) {
          const found = findMarkdownFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const markdownFile = findMarkdownFile(projectFiles);
    if (markdownFile) {
      const path = findPath(projectFiles, markdownFile.id);
      return path || [];
    }
    return [];
  }, [projectFiles]);

  // Build breadcrumb path for dafny file
  const dafnyBreadcrumb = useMemo(() => {
    if (!projectFiles || !projectFiles.length) {
      return [];
    }

    // Find first dafny file in project tree
    const findDafnyFile = (items: ProjectFileItem[]): ProjectFileItem | null => {
      for (const item of items) {
        if (item.type === 'dfy') {
          return item;
        }
        if (item.children) {
          const found = findDafnyFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const dafnyFile = findDafnyFile(projectFiles);
    if (dafnyFile) {
      const path = findPath(projectFiles, dafnyFile.id);
      return path || [];
    }
    return [];
  }, [projectFiles]);

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

  // Use dafny code from generated spec
  const dafnyCode = state.generatedSpec?.dafny_skeleton || defaultDafnyCode;
  const codeLines = dafnyCode.split("\n");

  // Parse markdown content to extract requirements for display
  const markdownContent = state.generatedSpec?.structured_spec || '';

  // Derive actual filenames from project files or use defaults
  const markdownFileName = useMemo(() => {
    if (markdownBreadcrumb.length > 0) {
      return markdownBreadcrumb[markdownBreadcrumb.length - 1].name;
    }
    return state.generatedSpec?.suggested_filename
      ? `${state.generatedSpec.suggested_filename}.md`
      : 'Requirements.md';
  }, [markdownBreadcrumb, state.generatedSpec?.suggested_filename]);

  const dafnyFileName = useMemo(() => {
    if (dafnyBreadcrumb.length > 0) {
      return dafnyBreadcrumb[dafnyBreadcrumb.length - 1].name;
    }
    return state.generatedSpec?.suggested_filename
      ? `${state.generatedSpec.suggested_filename}.dfy`
      : 'Spec.dfy';
  }, [dafnyBreadcrumb, state.generatedSpec?.suggested_filename]);

  // Check if we have any data (traceability matrix persists even when switching files)
  const hasData = referenceMappings.length > 0 || state.traceabilityMatrix.length > 0 || state.generatedSpec?.dafny_skeleton;

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
      <div
        className={cn(
          "flex flex-col border-r border-border transition-all duration-300",
          isResizing && "transition-none"
        )}
        style={{ width: `${leftPaneWidth}%` }}
      >
        {/* Tab Bar */}
        <div className="flex h-9 items-center border-b border-border bg-secondary/30">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-info" />
            <span>{markdownFileName}</span>
          </div>
          <span className="ml-2 rounded bg-info-muted px-1.5 py-0.5 text-[10px] font-medium text-info">
            Trace Mode
          </span>
          {state.statistics && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              {state.statistics.coverage_percentage.toFixed(0)}% coverage
            </span>
          )}
        </div>

        {/* Breadcrumb removed */}

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
                  No requirement mappings found. Generate a formal specification to create traceability links between requirements and Dafny code.
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
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0",
                            gap.severity === 'critical' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                          )}>
                            {gap.severity}
                          </span>
                          <span className="break-words text-foreground">{gap.description}</span>
                        </div>
                        {gap.suggestion && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Suggestion:</p>
                            <p className="mt-1 break-words whitespace-pre-wrap text-xs text-muted-foreground">
                              {gap.suggestion}
                            </p>
                          </div>
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
      {onResizeStart && (
        <div
          className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
          onMouseDown={onResizeStart}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
        </div>
      )}

      {/* Right Pane - Dafny Code */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isResizing && "transition-none"
        )}
        style={{ width: `${100 - leftPaneWidth}%` }}
      >
        {/* Tab Bar */}
        <div className="flex h-9 items-center border-b border-border bg-secondary/30">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <div className="h-3.5 w-3.5 rounded bg-primary/80" />
            <span>{dafnyFileName}</span>
          </div>
          {activeMapping && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              Showing: {activeMapping.id} (Lines {activeMapping.dafnyLines.start}-{activeMapping.dafnyLines.end})
            </span>
          )}
        </div>

        {/* Breadcrumb removed */}

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
                      isHighlighted && "bg-info-muted text-info"
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
                          ? "bg-info-muted ring-1 ring-inset ring-info/30"
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
