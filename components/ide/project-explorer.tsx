"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ChevronsUpDown,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";
import { useFileContext } from "@/lib/contexts/file-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ProjectFileItem, ProjectVerificationStatus, ProjectFileType, ProjectResponse, FileType } from "@/lib/types";
import { CreateProjectModal } from "@/components/project/create-project-modal";

export type FileType = ProjectFileType;
export type VerificationStatus = ProjectVerificationStatus;
export type FileItem = ProjectFileItem;

interface ProjectExplorerProps {
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasProject: boolean;
  width?: number; // Width in pixels when expanded
  isResizing?: boolean; // Whether explorer is being resized
}

// Empty default - projects start with no files
const defaultProjectFiles: FileItem[] = [];

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
  onDelete,
  onRename,
}: {
  item: FileItem;
  depth?: number;
  selectedFile: string;
  onFileSelect: (fileId: string) => void;
  onDelete?: (fileId: string, filename: string) => void;
  onRename?: (fileId: string, newName: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const isActive = selectedFile === item.id;
  const isFolder = item.type === "folder";
  const isUnit = item.type === "unit";
  const hasChildren = item.children && item.children.length > 0;
  const isFile = !isFolder && !isUnit;

  const handleDoubleClick = () => {
    if (isFile && item.file_id && onRename) {
      setIsRenaming(true);
      setRenameValue(item.name);
      setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  };

  const handleRenameSubmit = () => {
    if (isRenaming && item.file_id && onRename && renameValue.trim() && renameValue !== item.name) {
      onRename(item.file_id, renameValue.trim());
    }
    setIsRenaming(false);
    setRenameValue(item.name);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenameValue(item.name);
  };

  const handleDelete = () => {
    if (item.file_id && onDelete) {
      onDelete(item.file_id, item.name);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group relative">
        <div
          onClick={() => {
            if (isFolder || isUnit) {
              setIsExpanded(!isExpanded);
            } else {
              onFileSelect(item.id);
            }
          }}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "flex w-full items-center gap-1.5 py-1 pr-2 text-left text-xs transition-colors cursor-pointer",
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
          
          {isRenaming ? (
            <Input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') handleRenameCancel();
              }}
              className="h-5 flex-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{item.name}</span>
          )}
          
          {/* Verification Status */}
          {!isRenaming && <VerificationIcon status={item.verificationStatus} />}
          
          {/* Linked Dfy indicator for units */}
          {!isRenaming && isUnit && item.linkedDfy && (
            <span className="text-[10px] text-muted-foreground/60">
              {"->"} {item.linkedDfy}
            </span>
          )}

          {/* Context Menu for Files */}
          {!isRenaming && isFile && item.file_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-accent transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(isFolder || isUnit) && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function ProjectExplorer({
  selectedFile,
  onFileSelect,
  isCollapsed,
  onToggleCollapse,
  hasProject,
  width,
  isResizing,
}: ProjectExplorerProps & { isResizing?: boolean }) {
  const router = useRouter();
  const { state: projectState, switchProject, createProject } = useProject();
  const { state: fileState, deleteFile, renameFile, createNewFile, selectFile } = useFileContext();
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newFileType, setNewFileType] = useState<FileType>('md');
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Load projects for switcher (always load, even when no project)
  // Also reload when authentication state changes (e.g., after login)
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const lastAuthStateRef = useRef<boolean | null>(null);
  const isLoadingRef = useRef(false);

  const loadProjects = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoadingProjects(true);
      const response = await apiClient.listProjects({ limit: 50, sort: 'updated_at', order: 'desc' });
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only reload when auth loading completes and auth state actually changes
    if (!authLoading) {
      const authChanged = lastAuthStateRef.current !== isAuthenticated;
      lastAuthStateRef.current = isAuthenticated;
      
      if (authChanged || lastAuthStateRef.current === null) {
        loadProjects();
      }
    }
  }, [isAuthenticated, authLoading, loadProjects]);

  // Use project files from context or default
  const projectFiles = useMemo(() => {
    if (fileState.projectFiles.length > 0) {
      // Note: Verification status updates handled separately
      return fileState.projectFiles;
    }
    return defaultProjectFiles;
  }, [fileState.projectFiles]);

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

  const handleCreateProject = async (name: string, description?: string) => {
    await createProject(name, description);
    await loadProjects();
  };

  // No Project State
  if (!hasProject) {
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
          </div>
        </TooltipProvider>
      );
    }

    return (
      <>
        <CreateProjectModal
          open={showCreateProjectModal}
          onOpenChange={setShowCreateProjectModal}
          onCreateProject={handleCreateProject}
        />
        <div 
          className={cn(
            "flex h-full flex-col border-r border-border bg-secondary/20",
            isResizing && "transition-none"
          )}
          style={{ width: width ? `${width}px` : '224px' }}
        >
          {/* Header */}
          <div className="border-b border-border">
            <div className="flex h-9 items-center justify-between px-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Projects
              </span>
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowCreateProjectModal(true)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create Project</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            </div>
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-auto py-2">
            {isLoadingProjects ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No projects</div>
            ) : (
              <div className="px-2">
                {projects.map((project) => (
                  <button
                    key={project.project_id}
                    onClick={() => router.push(`/app/${project.project_id}`)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {project.file_count} files
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 py-2">
            <Button
              onClick={() => setShowCreateProjectModal(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Create Project
            </Button>
          </div>
        </div>
      </>
    );
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
                  onClick={async () => {
                    await selectFile("requirements.md");
                    onFileSelect("requirements.md");
                  }}
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
            {/* Dafny file button - check if any dfy files exist */}
            {fileState.projectFiles.some(f => 
              f.children?.some(c => c.type === 'dfy') || 
              f.type === 'dfy'
            ) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async () => {
                      await selectFile("spec.dfy");
                      onFileSelect("spec.dfy");
                    }}
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
                    {/* Verification status removed - handled by VerificationContext */}
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
    <div 
      className={cn(
        "flex h-full flex-col border-r border-border bg-secondary/20",
        isResizing && "transition-none"
      )}
      style={{ width: width ? `${width}px` : '224px' }}
    >
      {/* Header with Project Switcher */}
      <div className="border-b border-border">
        {projectState.currentProject && (
          <div className="px-2 py-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent">
                  <div className="flex-1 truncate">
                    <div className="font-medium text-foreground">{projectState.currentProject.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {projectState.currentProject.file_count} files
                    </div>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {isLoadingProjects ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No other projects</div>
                ) : (
                  projects.map((project) => (
                    <DropdownMenuItem
                      key={project.project_id}
                      onClick={() => switchProject(project.project_id)}
                      className={cn(
                        "flex items-center justify-between",
                        project.project_id === projectState.projectId && "bg-accent"
                      )}
                    >
                      <div className="flex-1 truncate">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {project.file_count} files
                        </div>
                      </div>
                      {project.project_id === projectState.projectId && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="flex h-9 items-center justify-between border-t border-border px-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Files
          </span>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNewFileDialog(true)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New File</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        </div>
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
            onFileSelect={async (fileId) => {
              // Use file_id if available, otherwise use id
              const actualFileId = fileState.projectFiles
                .flatMap(f => f.children || [])
                .find(f => f.id === fileId)?.file_id || fileId;
              await selectFile(actualFileId);
              onFileSelect(fileId);
            }}
            onDelete={async (fileId, filename) => {
              try {
                await deleteFile(fileId);
                toast.success(`Deleted ${filename}`);
              } catch (error) {
                toast.error(`Failed to delete ${filename}`);
              }
            }}
            onRename={async (fileId, newName) => {
              try {
                await renameFile(fileId, newName);
                toast.success(`Renamed to ${newName}`);
              } catch (error) {
                toast.error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
          />
        ))}
      </div>

      {/* New File Dialog */}
      <AlertDialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New File</AlertDialogTitle>
            <AlertDialogDescription>
              Select the file type you want to create.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 py-4">
            <button
              onClick={() => setNewFileType('md')}
              className={cn(
                "flex-1 rounded-lg border p-4 text-left transition-colors",
                newFileType === 'md' 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:bg-accent"
              )}
            >
              <FileText className="h-5 w-5 mb-2 text-info" />
              <div className="font-medium">Markdown</div>
              <div className="text-xs text-muted-foreground">.md</div>
            </button>
            <button
              onClick={() => setNewFileType('dfy')}
              className={cn(
                "flex-1 rounded-lg border p-4 text-left transition-colors",
                newFileType === 'dfy' 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:bg-accent"
              )}
            >
              <Shield className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Dafny</div>
              <div className="text-xs text-muted-foreground">.dfy</div>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (projectState.projectId) {
                  try {
                    await createNewFile(newFileType, projectState.projectId);
                    setShowNewFileDialog(false);
                  } catch (error) {
                    toast.error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }}
            >
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground/70">
          {stats.units > 0 
            ? `${stats.units} units | ${stats.verified} verified | ${stats.failed} failed`
            : fileState.projectFiles.some(f => f.type === 'dfy' || f.children?.some(c => c.type === 'dfy')) ? '1 spec file' : 'No spec generated yet'
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
