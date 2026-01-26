"use client";

import { useState, useCallback, useMemo } from "react";
import { FileText, ChevronRight, Sparkles, ArrowRight, Hash, List, CheckSquare, Layers, AlertTriangle, Edit3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProject } from "@/lib/project-context";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  onGenerateSpec: () => void;
  isGenerating?: boolean;
  isRootFile?: boolean;
  onDeconstructToUnits?: () => void;
  isDeconstructing?: boolean;
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
  isRootFile = true,
  onDeconstructToUnits,
  isDeconstructing,
}: MarkdownEditorProps) {
  const { state, setMarkdownContent, saveFile } = useProject();
  const [isEditing, setIsEditing] = useState(true);
  const [localContent, setLocalContent] = useState(state.markdownContent);

  // Sync local content when context changes (e.g., after project creation)
  useMemo(() => {
    if (state.markdownContent !== localContent && !isEditing) {
      setLocalContent(state.markdownContent);
    }
  }, [state.markdownContent]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setMarkdownContent(newContent);
  }, [setMarkdownContent]);

  const handleSave = useCallback(async () => {
    try {
      await saveFile('requirements.md', localContent, 'markdown');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [saveFile, localContent]);

  // Use local content for display, fallback to context
  const displayContent = localContent || state.markdownContent || defaultMarkdownContent;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-secondary/30">
        <div className="flex items-center">
          <div className="flex h-9 items-center gap-2 border-r border-border bg-background px-3 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span>Requirements.md</span>
            {isRootFile && (
              <span className="ml-1 rounded bg-yellow-500/20 px-1 py-0.5 text-[10px] font-medium text-yellow-500">
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
          <Button
            onClick={handleSave}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Save
          </Button>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onGenerateSpec}
                  disabled={isGenerating || !displayContent.trim()}
                  size="sm"
                  className="h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-primary px-3 text-xs font-medium text-foreground hover:from-violet-500/90 hover:to-primary/90"
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
        <span>Root Spec</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Requirements.md</span>
      </div>

      {/* Deconstruction Action Bar (for Root MD files in Edit mode) */}
      {isRootFile && onDeconstructToUnits && (
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-violet-500/10 to-primary/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">
              This is a root specification file. Break it down into provable units for verification.
            </span>
          </div>
          <Button
            onClick={onDeconstructToUnits}
            disabled={isDeconstructing}
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-violet-500/50 bg-violet-500/20 px-3 text-xs font-medium text-violet-300 hover:bg-violet-500/30 hover:text-violet-200"
          >
            <Layers className={`h-3.5 w-3.5 ${isDeconstructing ? "animate-pulse" : ""}`} />
            <span>{isDeconstructing ? "Deconstructing..." : "Deconstruct to Units"}</span>
          </Button>
        </div>
      )}

      {/* Toolbar (only in edit mode) */}
      {isEditing && (
        <div className="flex h-8 items-center gap-1 border-b border-border bg-secondary/10 px-3">
          <button 
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = localContent.slice(0, start) + '# ' + localContent.slice(end);
                setLocalContent(newContent);
                setMarkdownContent(newContent);
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
            value={localContent || displayContent}
            onChange={handleContentChange}
            placeholder="Write your requirements specification in Markdown..."
            className="h-full w-full resize-none bg-transparent p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
          />
        ) : (
          /* Preview Mode - Rendered Markdown */
          <div className="mx-auto max-w-3xl px-8 py-6">
            <article className="prose prose-invert prose-sm max-w-none">
              {renderMarkdown(displayContent)}
            </article>
          </div>
        )}
      </div>
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
