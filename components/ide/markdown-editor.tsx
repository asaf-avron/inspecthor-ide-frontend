"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { FileText, ChevronRight, Sparkles, ArrowRight, Hash, List, CheckSquare, Layers, AlertTriangle, Edit3, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBlueprint } from "@/lib/blueprint-context";
import { useFileContext } from "@/lib/contexts/file-context";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { SaveStatusIndicator } from "./save-status-indicator";
import { SpecRefinementView } from "./spec-refinement-view";
import { apiClient } from "@/lib/api-client";
import type { TraceabilityLink } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  onGenerateSpec: () => void;
  isGenerating?: boolean;
  isRootFile?: boolean;  // True if file has units (has been deconstructed)
}

// Unit Link Badge Component
function UnitLinkBadge({
  title,
  lineNumber,
  onClick
}: {
  title: string;
  lineNumber: number;
  onClick: () => void
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            style={{ top: `${lineNumber * 1.5}em` }}
            className="absolute -left-8 flex items-center gap-1 rounded bg-info/20 px-1.5 py-0.5 text-[10px] font-medium text-info transition-all hover:bg-info/30 hover:scale-105"
          >
            <Link2 className="h-2.5 w-2.5" />
            <span className="max-w-[100px] truncate">{title}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">Click to open {title} Dafny file</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simple markdown renderer for preview
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="mb-4 space-y-1.5 text-sm text-muted-foreground">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="rounded bg-background px-1 py-0.5 text-primary font-mono text-xs">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="mb-4 overflow-auto rounded-lg bg-background p-4 font-mono text-sm text-foreground">
            {codeContent.join('\n')}
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          {line.slice(2)}
        </h1>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="mb-2 mt-6 flex items-center gap-2 text-lg font-medium text-foreground">
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mb-2 mt-4 text-sm font-medium text-foreground">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-6 border-border" />);
      continue;
    }

    // List items
    if (line.match(/^[-*]\s+/)) {
      const content = line.replace(/^[-*]\s+/, '');
      listItems.push(content);
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="mb-4 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    }
  }

  flushList();
  return elements;
}

export function MarkdownEditor({
  onGenerateSpec,
  isGenerating,
  isRootFile = false,  // Default to false - only true if file has units
}: MarkdownEditorProps) {
  const { state: blueprintState, findGaps, refineSpec } = useBlueprint();
  const { state: fileState, updateFileContent, forceSaveCurrentFile, selectFile } = useFileContext();
  const [isEditing, setIsEditing] = useState(true);
  const [traceabilityLinks, setTraceabilityLinks] = useState<TraceabilityLink[]>([]);
  const [showRefinementView, setShowRefinementView] = useState(false);

  // Get current file content from activeFile
  const currentContent = fileState.activeFile?.content ?? '';

  // Auto-save hook
  const autoSave = useAutoSave({
    fileId: fileState.activeFile?.id || null,
    content: currentContent,
    syncedContent: fileState.activeFile?.syncedContent ?? currentContent,
    onSave: async () => {
      if (fileState.activeFile) {
        await forceSaveCurrentFile();
      }
    },
    onSaveSuccess: () => {
      // Success handled by hook
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error);
    },
  });

  // Fetch traceability links when viewing root file
  useEffect(() => {
    const fetchTraceability = async () => {
      if (isRootFile && fileState.activeFile?.id) {
        try {
          const response = await apiClient.getTraceability(fileState.activeFile.id);
          setTraceabilityLinks(response.links);
        } catch (error) {
          console.error('Failed to fetch traceability:', error);
          setTraceabilityLinks([]);
        }
      } else {
        setTraceabilityLinks([]);
      }
    };

    fetchTraceability();
  }, [isRootFile, fileState.activeFile?.id]);

  // Update content when activeFile changes
  useEffect(() => {
    if (fileState.activeFile && fileState.activeFile.fileType === 'md') {
      // Content synced via activeFile
    }
  }, [fileState.activeFile]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateFileContent(newContent);
  }, [updateFileContent]);

  const handleForceSave = useCallback(async () => {
    try {
      await forceSaveCurrentFile();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [forceSaveCurrentFile]);

  const handleUnitLinkClick = useCallback(async (dafnyFileId: string) => {
    try {
      await selectFile(dafnyFileId);
    } catch (error) {
      console.error('Failed to open unit file:', error);
    }
  }, [selectFile]);

  // Use activeFile content or fallback (only use default if content is null/undefined, not empty string)
  const displayContent = currentContent !== null && currentContent !== undefined ? currentContent : defaultMarkdownContent;
  const filename = fileState.activeFile?.filename || 'Requirements.md';

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-secondary/30">
        <div className="flex items-center">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-info" />
            <span>{filename}</span>
            {fileState.activeFile && (
              <SaveStatusIndicator
                status={autoSave.status}
                onRetry={autoSave.retrySave}
              />
            )}
            {isRootFile && (
              <span className="ml-1 rounded bg-warning/20 px-1 py-0.5 text-[10px] font-medium text-warning">
                Root
              </span>
            )}
          </div>

          {/* Edit/Preview Toggle */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "flex h-6 items-center gap-1 rounded px-2 text-xs transition-colors",
                isEditing ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={cn(
                "flex h-6 items-center gap-1 rounded px-2 text-xs transition-colors",
                !isEditing ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-2 pr-2">
          {fileState.activeFile && autoSave.status !== 'clean' && (
            <Button
              onClick={handleForceSave}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={autoSave.status === 'saving'}
            >
              {autoSave.status === 'saving' ? 'Saving...' : 'Save'}
            </Button>
          )}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={async () => {
                    // Find gaps if not already found
                    if (blueprintState.gaps.length === 0 && fileState.activeFile?.id) {
                      try {
                        await findGaps(displayContent, blueprintState.blueprintId || undefined, fileState.activeFile.id);
                      } catch (error) {
                        console.error("Failed to find gaps:", error);
                      }
                    }
                    setShowRefinementView(true);
                  }}
                  disabled={blueprintState.isRefining || !displayContent.trim()}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  <Edit3 className={`h-3.5 w-3.5 ${blueprintState.isRefining ? "animate-pulse" : ""}`} />
                  <span>{blueprintState.isRefining ? "Refining..." : "Refine Spec"}</span>
                  {blueprintState.gaps.length > 0 && (
                    <span className="ml-1 rounded bg-warning/20 px-1 py-0.5 text-[10px] font-medium text-warning">
                      {blueprintState.gaps.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {blueprintState.gaps.length > 0
                    ? `Review and apply ${blueprintState.gaps.length} gap suggestion${blueprintState.gaps.length > 1 ? 's' : ''} before generating formal spec`
                    : "Find and fix gaps in your specification"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onGenerateSpec}
                  disabled={isGenerating || !displayContent.trim()}
                  size="sm"
                  className="h-7 gap-1.5 bg-gradient-to-r from-accent-violet to-primary px-3 text-xs font-medium text-primary-foreground hover:from-accent-violet/90 hover:to-primary/90"
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

      {/* Breadcrumb - only show "Root Spec" if file has units */}
      {isRootFile && (
        <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
          <span>Root Spec</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{filename}</span>
        </div>
      )}

      {/* Root badge indicator - shows when file has units */}
      {isRootFile && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-4 py-1.5">
          <span className="text-xs text-muted-foreground">
            This specification has been broken down into verifiable units.
          </span>
        </div>
      )}

      {/* Toolbar (only in edit mode) */}
      {isEditing && (
        <div className="flex h-8 items-center gap-1 border-b border-border bg-secondary/10 px-3">
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => {
              const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = displayContent.slice(0, start) + '# ' + displayContent.slice(end);
                updateFileContent(newContent);
              }
            }}
          >
            <Hash className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <List className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <div className="mx-2 h-4 w-px bg-border" />
          <span className="text-[10px] text-muted-foreground">
            {displayContent.length} characters
          </span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          /* Edit Mode - Textarea */
          <textarea
            value={displayContent}
            onChange={handleContentChange}
            placeholder="Write your requirements specification in Markdown..."
            className="h-full w-full resize-none bg-transparent p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />
        ) : (
          /* Preview Mode - Rendered Markdown with Ghost Link Badges */
          <div className="relative ml-0 max-w-3xl px-8 py-6">
            {/* Ghost Link Badges - positioned absolutely based on line numbers */}
            {traceabilityLinks.length > 0 && traceabilityLinks.map((link) => (
              <UnitLinkBadge
                key={link.unit_id}
                title={link.title}
                lineNumber={link.source_range.start_line}
                onClick={() => handleUnitLinkClick(link.dafny_file_id)}
              />
            ))}
            <article className="prose prose-invert prose-sm max-w-none">
              {renderMarkdown(displayContent)}
            </article>
          </div>
        )}
      </div>
      <SpecRefinementView open={showRefinementView} onClose={() => setShowRefinementView(false)} />
    </div>
  );
}

// Default content when no project is loaded
const defaultMarkdownContent = `# Requirements Specification

## Overview
Describe your system requirements here.

## Functional Requirements

### FR-1: Core Functionality
- **FR-1.1**: Users MUST be able to...
- **FR-1.2**: The system MUST...

## Security Invariants

### SI-1: Data Integrity
- All data MUST be validated before processing

## Notes
- This specification will be translated to Dafny formal verification code
`;
