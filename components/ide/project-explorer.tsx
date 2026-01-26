"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Shield,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
  Puzzle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProject } from "@/lib/project-context";
import type { ProjectFileItem, ProjectVerificationStatus, ProjectFileType } from "@/lib/types";

export type FileType = ProjectFileType;
export type VerificationStatus = ProjectVerificationStatus;
export type FileItem = ProjectFileItem;

interface ProjectExplorerProps {
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasProject: boolean;
}

// Default project structure when no files exist
const defaultProjectFiles: FileItem[] = [
  {
    id: "root-spec",
    name: "Root Spec (Project)",
    type: "folder",
    children: [
      { 
        id: "requirements.md", 
        name: "Requirements.md", 
        type: "md",
      },
    ],
  },
];

function VerificationIcon({ status }: { status?: VerificationStatus }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />;
    case "failed":
      return <XCircle className="h-3 w-3 shrink-0 text-destructive" />;
    case "pending":
      return <Loader2 className="h-3 w-3 shrink-0 animate-spin text-warning" />;
    default:
      return null;
  }
}

function FileIcon({ type, isActive }: { type: FileType; isActive?: boolean }) {
  switch (type) {
    case "md":
      return (
        <FileText
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-info" : "text-info/70"
          )}
        />
      );
    case "dfy":
      return (
        <Shield
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-primary" : "text-primary/70"
          )}
        />
      );
    case "unit":
      return (
        <Puzzle
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-accent-violet" : "text-accent-violet/70"
          )}
        />
      );
    default:
      return null;
  }
}

function FileTreeItem({
  item,
  depth = 0,
  selectedFile,
  onFileSelect,
}: {
  item: FileItem;
  depth?: number;
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = selectedFile === item.id;
  const isFolder = item.type === "folder";
  const isUnit = item.type === "unit";
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder || isUnit) {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(item.id);
          }
        }}
        className={cn(
          "flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs transition-colors",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {(isFolder || (isUnit && hasChildren)) ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-warning" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-warning" />
              )
            ) : (
              <FileIcon type={item.type} isActive={isActive} />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileIcon type={item.type} isActive={isActive} />
          </>
        )}
        <span className="flex-1 truncate">{item.name}</span>
        
        {/* Verification Status */}
        <VerificationIcon status={item.verificationStatus} />
        
        {/* Linked Dfy indicator for units */}
        {isUnit && item.linkedDfy && (
          <span className="text-[10px] text-muted-foreground/60">
            {"->"} {item.linkedDfy}
          </span>
        )}
      </button>

      {(isFolder || isUnit) && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectExplorer({
  selectedFile,
  onFileSelect,
  isCollapsed,
  onToggleCollapse,
  hasProject,
}: ProjectExplorerProps) {
  const { state } = useProject();

  // Use project files from context or default
  const projectFiles = useMemo(() => {
    if (state.projectFiles.length > 0) {
      // Update verification status based on verification results
      return updateVerificationStatus(state.projectFiles, state.verificationResults?.verified);
    }
    return defaultProjectFiles;
  }, [state.projectFiles, state.verificationResults]);

  // Calculate stats
  const stats = useMemo(() => {
    let units = 0;
    let verified = 0;
    let failed = 0;
    let pending = 0;

    const countItems = (items: FileItem[]) => {
      for (const item of items) {
        if (item.type === 'unit') {
          units++;
          if (item.verificationStatus === 'verified') verified++;
          else if (item.verificationStatus === 'failed') failed++;
          else if (item.verificationStatus === 'pending') pending++;
        }
        if (item.children) countItems(item.children);
      }
    };

    countItems(projectFiles);
    return { units, verified, failed, pending };
  }, [projectFiles]);

  if (!hasProject) {
    return null;
  }

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full w-10 flex-col border-r border-border bg-secondary/20">
          <div className="flex h-9 items-center justify-center border-b border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Explorer</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFileSelect("requirements.md")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors",
                    selectedFile === "requirements.md" || selectedFile.endsWith(".md")
                      ? "bg-accent text-info"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Requirements.md</p>
              </TooltipContent>
            </Tooltip>
            {state.dafnyCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onFileSelect("spec.dfy")}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded transition-colors",
                      selectedFile === "spec.dfy" || selectedFile.endsWith(".dfy")
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="flex items-center gap-2">
                    <span>Spec.dfy</span>
                    {state.verificationResults?.verified ? (
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    ) : state.verificationResults?.verified === false ? (
                      <XCircle className="h-3 w-3 text-destructive" />
                    ) : (
                      <Loader2 className="h-3 w-3 text-warning" />
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-secondary/20">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Traceability
        </span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse Explorer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 border-b border-border bg-secondary/30 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">Verified</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-destructive" />
          <span className="text-[10px] text-muted-foreground">Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 text-warning" />
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto py-1">
        {projectFiles.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground/70">
          {stats.units > 0 
            ? `${stats.units} units | ${stats.verified} verified | ${stats.failed} failed`
            : state.dafnyCode ? '1 spec file' : 'No spec generated yet'
          }
        </p>
      </div>
    </div>
  );
}

// Helper function to update verification status in project files
function updateVerificationStatus(files: FileItem[], verified?: boolean): FileItem[] {
  return files.map(file => {
    const newFile = { ...file };
    
    // Update dfy files based on verification
    if (file.type === 'dfy' && verified !== undefined) {
      newFile.verificationStatus = verified ? 'verified' : 'failed';
    }
    
    if (file.children) {
      newFile.children = updateVerificationStatus(file.children, verified);
    }
    
    return newFile;
  });
}
