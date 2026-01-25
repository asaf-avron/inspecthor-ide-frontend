"use client";

import { useState } from "react";
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

export type FileType = "md" | "dfy" | "folder" | "unit";

export type VerificationStatus = "verified" | "failed" | "pending" | "none";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  linkedDfy?: string;
  verificationStatus?: VerificationStatus;
  children?: FileItem[];
}

interface ProjectExplorerProps {
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasProject: boolean;
}

// Updated project structure for traceability
const projectFiles: FileItem[] = [
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
      { 
        id: "unit-auth", 
        name: "Unit 1: Auth Logic", 
        type: "unit",
        linkedDfy: "Auth.dfy",
        verificationStatus: "verified",
        children: [
          { 
            id: "auth.dfy", 
            name: "Auth.dfy", 
            type: "dfy",
            verificationStatus: "verified",
          },
        ],
      },
      { 
        id: "unit-tx", 
        name: "Unit 2: Transaction", 
        type: "unit",
        linkedDfy: "Tx.dfy",
        verificationStatus: "failed",
        children: [
          { 
            id: "spec.dfy", 
            name: "Spec.dfy", 
            type: "dfy",
            verificationStatus: "failed",
          },
        ],
      },
      { 
        id: "unit-utils", 
        name: "Unit 3: Utilities", 
        type: "unit",
        linkedDfy: "Utils.dfy",
        verificationStatus: "pending",
        children: [
          { 
            id: "utils.dfy", 
            name: "Utils.dfy", 
            type: "dfy",
            verificationStatus: "pending",
          },
        ],
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

function FileIcon({ type, isActive, linkedDfy }: { type: FileType; isActive?: boolean; linkedDfy?: string }) {
  switch (type) {
    case "md":
      return (
        <FileText
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-blue-400" : "text-blue-400/70"
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
            isActive ? "text-violet-400" : "text-violet-400/70"
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
                <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500/80" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-yellow-500/80" />
              )
            ) : (
              <FileIcon type={item.type} isActive={isActive} linkedDfy={item.linkedDfy} />
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
                    selectedFile === "requirements.md"
                      ? "bg-accent text-blue-400"
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFileSelect("spec.dfy")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors",
                    selectedFile === "spec.dfy"
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
                  <XCircle className="h-3 w-3 text-destructive" />
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFileSelect("auth.dfy")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors",
                    selectedFile === "auth.dfy"
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Shield className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="flex items-center gap-2">
                  <span>Auth.dfy</span>
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
              </TooltipContent>
            </Tooltip>
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
          3 units | 1 verified | 1 failed
        </p>
      </div>
    </div>
  );
}
