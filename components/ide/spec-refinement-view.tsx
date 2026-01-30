"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { X, Check, CheckSquare, Square, Eye, FileText, ArrowRight, RefreshCw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProject } from "@/lib/project-context";
import { useFileContext } from "@/lib/contexts/file-context";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { diffLines, Change } from "diff";
import type { Gap } from "@/lib/types";

type ViewMode = "text" | "preview";

interface SpecRefinementViewProps {
  open: boolean;
  onClose: () => void;
}

function DiffView({ 
  original, 
  refined, 
  viewMode,
  isOriginal,
  selectedGapIds,
  gaps
}: { 
  original: string; 
  refined: string; 
  viewMode: ViewMode;
  isOriginal?: boolean;
  selectedGapIds?: Set<string>;
  gaps?: Gap[];
}) {
  const diff = useMemo(() => {
    return diffLines(original, refined);
  }, [original, refined]);

  const content = isOriginal ? original : refined;

  // Get line numbers related to selected gaps
  const highlightedLines = useMemo(() => {
    if (!selectedGapIds || selectedGapIds.size === 0 || !gaps) {
      return new Set<number>();
    }
    const lines = new Set<number>();
    gaps.forEach(gap => {
      if (selectedGapIds.has(gap.id) && gap.location.line !== null) {
        // Highlight the gap line and a few lines around it for context
        const lineNum = gap.location.line;
        for (let i = Math.max(1, lineNum - 2); i <= lineNum + 2; i++) {
          lines.add(i);
        }
      }
    });
    return lines;
  }, [selectedGapIds, gaps]);

  if (viewMode === "preview") {
    return (
      <div className="h-full overflow-auto p-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Text mode with diff highlighting
  let lineNumber = 1;
  const lines = content.split('\n');
  
  return (
    <div className="h-full overflow-auto font-mono text-sm">
      <div className="min-w-full">
        {lines.map((line, index) => {
          // Determine if this line is added/removed/unchanged by checking diff
          let bgColor = "bg-transparent";
          let borderColor = "";
          let isHighlighted = highlightedLines.has(lineNumber);
          
          if (!isOriginal) {
            // For refined view, check if line was added
            const diffIndex = diff.findIndex((part: Change) => {
              if (part.added) {
                const partLines = part.value.split('\n').filter(l => l !== '');
                return partLines.includes(line);
              }
              return false;
            });
            if (diffIndex !== -1) {
              bgColor = "bg-green-500/20 dark:bg-green-500/10";
              borderColor = "border-l-2 border-green-500";
            }
          } else {
            // For original view, check if line was removed
            const diffIndex = diff.findIndex((part: Change) => {
              if (part.removed) {
                const partLines = part.value.split('\n').filter(l => l !== '');
                return partLines.includes(line);
              }
              return false;
            });
            if (diffIndex !== -1) {
              bgColor = "bg-red-500/20 dark:bg-red-500/10";
              borderColor = "border-l-2 border-red-500";
            }
          }

          // Add highlight for selected gaps
          if (isHighlighted) {
            bgColor = isOriginal 
              ? "bg-yellow-500/30 dark:bg-yellow-500/20" 
              : "bg-blue-500/30 dark:bg-blue-500/20";
            if (!borderColor) {
              borderColor = isOriginal 
                ? "border-l-2 border-yellow-500" 
                : "border-l-2 border-blue-500";
            }
          }

          return (
            <div
              key={index}
              className={cn(
                "flex items-start px-2 py-0.5 transition-colors",
                bgColor,
                borderColor,
                isHighlighted && "ring-1 ring-yellow-400/50 dark:ring-yellow-500/30"
              )}
            >
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground select-none">
                {lineNumber++}
              </span>
              <span className="flex-1 pl-2">{line || " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpecRefinementView({ open, onClose }: SpecRefinementViewProps) {
  const { state: projectState, refineSpec } = useProject();
  const { state: fileState, updateFile } = useFileContext();
  const [selectedGapIds, setSelectedGapIds] = useState<Set<string>>(new Set());
  const [appliedGapIds, setAppliedGapIds] = useState<Set<string>>(new Set()); // Track applied gaps for rollback
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [isApplying, setIsApplying] = useState(false);
  const [previousRefinedSpec, setPreviousRefinedSpec] = useState<string | null>(null); // For rollback
  const [lastAppliedGapIds, setLastAppliedGapIds] = useState<Set<string>>(new Set()); // Track last applied gaps for rollback

  // Get markdown content from active file
  const originalSpec = fileState.activeFile?.fileType === 'md' ? fileState.activeFile.content : "";
  const refinedSpec = projectState.refinedSpec || originalSpec;

  // Initialize refinement when dialog opens
  useEffect(() => {
    if (open && projectState.gaps.length > 0 && !projectState.refinedSpec && originalSpec) {
      // Auto-refine with all gaps when dialog opens
      refineSpec(originalSpec).catch((error) => {
        console.error("Failed to initialize refinement:", error);
      });
    }
    // Reset applied gaps when dialog closes
    if (!open) {
      setAppliedGapIds(new Set());
      setPreviousRefinedSpec(null);
      setLastAppliedGapIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToggleGap = useCallback((gapId: string) => {
    // Don't allow toggling applied gaps
    if (appliedGapIds.has(gapId)) return;
    
    setSelectedGapIds((prev) => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  }, [appliedGapIds]);

  const handleSelectAll = useCallback(() => {
    const unappliedGaps = projectState.gaps
      .filter(g => !appliedGapIds.has(g.id))
      .map(g => g.id);
    setSelectedGapIds(new Set(unappliedGaps));
  }, [projectState.gaps, appliedGapIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedGapIds(new Set());
  }, []);

  const handleApplySelected = useCallback(async () => {
    if (selectedGapIds.size === 0) return;
    
    setIsApplying(true);
    try {
      // Save current state for rollback
      setPreviousRefinedSpec(refinedSpec);
      setLastAppliedGapIds(new Set(selectedGapIds));
      
      await refineSpec(originalSpec, Array.from(selectedGapIds));
      
      // Mark gaps as applied and clear selection
      setAppliedGapIds(prev => {
        const next = new Set(prev);
        selectedGapIds.forEach(id => next.add(id));
        return next;
      });
      setSelectedGapIds(new Set());
    } catch (error) {
      console.error("Failed to refine with selected gaps:", error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedGapIds, refineSpec, refinedSpec]);

  const handleApplyAll = useCallback(async () => {
    setIsApplying(true);
    try {
      // Save current state for rollback
      setPreviousRefinedSpec(refinedSpec);
      const allGapIds = new Set(projectState.gaps.map(g => g.id));
      setLastAppliedGapIds(allGapIds);
      
      await refineSpec(originalSpec);
      
      // Mark all gaps as applied
      setAppliedGapIds(allGapIds);
      setSelectedGapIds(new Set());
    } catch (error) {
      console.error("Failed to apply all gaps:", error);
    } finally {
      setIsApplying(false);
    }
  }, [refineSpec, refinedSpec, projectState.gaps, originalSpec]);

  const handleRollback = useCallback(async () => {
    if (!previousRefinedSpec || lastAppliedGapIds.size === 0) return;
    
    setIsApplying(true);
    try {
      // Restore previous refined spec by calling refineSpec with remaining gaps
      const remainingGaps = projectState.gaps
        .filter(g => !lastAppliedGapIds.has(g.id))
        .map(g => g.id);
      
      if (remainingGaps.length > 0) {
        await refineSpec(originalSpec, remainingGaps);
      } else {
        // If no remaining gaps, restore to original spec
        // Call refineSpec with empty array to get original (no gaps applied)
        await refineSpec(originalSpec, []);
      }
      
      // Remove the last applied gaps from applied set
      setAppliedGapIds(prev => {
        const next = new Set(prev);
        lastAppliedGapIds.forEach(id => next.delete(id));
        return next;
      });
      setLastAppliedGapIds(new Set());
      setPreviousRefinedSpec(null);
    } catch (error) {
      console.error("Failed to rollback:", error);
    } finally {
      setIsApplying(false);
    }
  }, [previousRefinedSpec, lastAppliedGapIds, refineSpec, projectState.gaps, originalSpec]);

  const handleAcceptRefinement = useCallback(async () => {
    if (!fileState.activeFile || !projectState.refinedSpec) {
      return;
    }
    try {
      // Update the file with refined content
      await updateFile(fileState.activeFile.id, projectState.refinedSpec);
      onClose();
    } catch (error) {
      console.error("Failed to apply refinement:", error);
    }
  }, [fileState.activeFile, projectState.refinedSpec, updateFile, onClose]);

  const handleRegenerate = useCallback(async () => {
    setIsApplying(true);
    try {
      await refineSpec(originalSpec, selectedGapIds.size > 0 ? Array.from(selectedGapIds) : undefined);
    } catch (error) {
      console.error("Failed to regenerate refinement:", error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedGapIds, refineSpec, originalSpec]);

  if (projectState.gaps.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Refine Specification</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Gaps Selection */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Gaps ({projectState.gaps.length})</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleDeselectAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={handleApplySelected}
                  disabled={selectedGapIds.size === 0 || isApplying}
                >
                  Apply Selected ({selectedGapIds.size})
                </Button>
                <Button
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={handleApplyAll}
                  disabled={isApplying}
                >
                  Apply All
                </Button>
              </div>
              {appliedGapIds.size > 0 && previousRefinedSpec && lastAppliedGapIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={handleRollback}
                  disabled={isApplying}
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                  Undo Last Apply
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {projectState.gaps.map((gap) => {
                const isSelected = selectedGapIds.has(gap.id);
                const isApplied = appliedGapIds.has(gap.id);
                return (
                  <div
                    key={gap.id}
                    className={cn(
                      "rounded-lg border p-3 text-sm transition-colors",
                      isApplied 
                        ? "border-green-500/50 bg-green-500/10 cursor-default opacity-75"
                        : "cursor-pointer",
                      isSelected && !isApplied
                        ? "border-primary bg-primary/10"
                        : !isApplied && gap.severity === "critical"
                        ? "border-destructive/50 bg-destructive/10"
                        : !isApplied && "border-warning/50 bg-warning/10"
                    )}
                    onClick={() => !isApplied && handleToggleGap(gap.id)}
                  >
                    <div className="flex items-start gap-2">
                      {isApplied ? (
                        <Check className="h-4 w-4 mt-0.5 text-green-500" />
                      ) : isSelected ? (
                        <CheckSquare className="h-4 w-4 mt-0.5 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium",
                              gap.severity === "critical"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-warning/20 text-warning"
                            )}
                          >
                            {gap.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">{gap.id}</span>
                          {gap.location.line && (
                            <span className="text-xs text-muted-foreground">L{gap.location.line}</span>
                          )}
                          {isApplied && (
                            <span className="text-xs text-green-500">Applied</span>
                          )}
                        </div>
                        <p className="text-xs text-foreground">{gap.description}</p>
                        {gap.suggestion && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {gap.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Side-by-side Diff */}
          <div className="flex-1 flex flex-col">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "text" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1.5 px-3 text-xs"
                  onClick={() => setViewMode("text")}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Text
                </Button>
                <Button
                  variant={viewMode === "preview" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1.5 px-3 text-xs"
                  onClick={() => setViewMode("preview")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 px-3 text-xs"
                onClick={handleRegenerate}
                disabled={isApplying || projectState.isRefining}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", (isApplying || projectState.isRefining) && "animate-spin")} />
                Regenerate
              </Button>
            </div>

            {/* Side-by-side Panes */}
            <div className="flex-1 flex overflow-hidden">
              {/* Original Spec */}
              <div className="flex-1 flex flex-col border-r">
                <div className="px-4 py-2 border-b bg-secondary/30">
                  <span className="text-xs font-medium text-muted-foreground">Original</span>
                </div>
                <DiffView 
                  original={originalSpec} 
                  refined={refinedSpec} 
                  viewMode={viewMode} 
                  isOriginal={true}
                  selectedGapIds={selectedGapIds}
                  gaps={projectState.gaps}
                />
              </div>

              {/* Refined Spec */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b bg-secondary/30">
                  <span className="text-xs font-medium text-muted-foreground">Refined</span>
                </div>
                <DiffView 
                  original={originalSpec} 
                  refined={refinedSpec} 
                  viewMode={viewMode} 
                  isOriginal={false}
                  selectedGapIds={selectedGapIds}
                  gaps={projectState.gaps}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isApplying || projectState.isRefining}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", (isApplying || projectState.isRefining) && "animate-spin")} />
              Regenerate Refinement
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptRefinement}
              disabled={!projectState.refinedSpec || projectState.refinedSpec === originalSpec}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Accept Refinement
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
