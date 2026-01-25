"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Shield,
  Wrench,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FileType = "md" | "dfy" | "folder";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  children?: FileItem[];
}

interface ProjectExplorerProps {
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const projectFiles: FileItem[] = [
  {
    id: "contracts",
    name: "contracts",
    type: "folder",
    children: [
      { id: "requirements.md", name: "requirements.md", type: "md" },
      { id: "spec.dfy", name: "spec.dfy", type: "dfy" },
      { id: "utils.dfy", name: "utils.dfy", type: "dfy" },
    ],
  },
];

function FileIcon({ type, isActive }: { type: FileType; isActive?: boolean }) {
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
    default:
      return <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />;
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

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
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
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500/80" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-yellow-500/80" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileIcon type={item.type} isActive={isActive} />
          </>
        )}
        <span className="truncate">{item.name}</span>
      </button>

      {isFolder && isExpanded && item.children && (
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
}: ProjectExplorerProps) {
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
                <p>requirements.md</p>
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
                <p>spec.dfy</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onFileSelect("utils.dfy")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded transition-colors",
                    selectedFile === "utils.dfy"
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Wrench className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>utils.dfy</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full w-52 flex-col border-r border-border bg-secondary/20">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Explorer
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
          3 files in project
        </p>
      </div>
    </div>
  );
}
