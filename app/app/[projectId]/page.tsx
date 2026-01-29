"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/lib/project-context";
import { useFileContext } from "@/lib/contexts/file-context";
import { useVerificationContext } from "@/lib/contexts/verification-context";
import { Header, ViewMode } from "@/components/ide/header";
import { ProjectExplorer } from "@/components/ide/project-explorer";
import { CodeEditor } from "@/components/ide/code-editor";
import { MarkdownEditor } from "@/components/ide/markdown-editor";
import { VerificationPanel } from "@/components/ide/verification-panel";
import { GeminiInsightPanel } from "@/components/ide/gemini-insight-panel";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { TraceabilityView } from "@/components/ide/traceability-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string | undefined;

  const {
    state: projectState,
    loadProjectFromUrl,
    checkHealth,
    generateSpec,
    hasUnits,
    deconstructToUnits,
    addLog,
  } = useProject();
  const { state: fileState, selectFile } = useFileContext();
  const { state: verificationState, runVerification } = useVerificationContext();

  // Load project from URL on mount
  useEffect(() => {
    if (!projectId) {
      router.push('/app');
      return;
    }

    if (projectId !== projectState.projectId) {
      loadProjectFromUrl(projectId).catch((error: any) => {
        if (error.status === 404 || error.status === 403) {
          router.push('/app');
        }
      });
    }
  }, [projectId, projectState.projectId, loadProjectFromUrl, router]);

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Local UI state
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("verification");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [rightPaneWidth, setRightPaneWidth] = useState(40);
  const [tracePaneWidth, setTracePaneWidth] = useState(50); // Left pane width percentage for trace mode
  const [terminalHeight, setTerminalHeight] = useState(200); // Terminal height in pixels
  const [explorerWidth, setExplorerWidth] = useState(224); // Explorer width in pixels (default w-56 = 224px)
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);
  const [isRootFile, setIsRootFile] = useState(false);

  const selectedFile = fileState.selectedFileId || null;

  const handleRunVerification = useCallback(async () => {
    setIsTerminalCollapsed(false);
    // Get Dafny code from active file
    const dafnyCode = fileState.activeFile?.fileType === 'dfy' ? fileState.activeFile.content : '';
    if (dafnyCode) {
      await runVerification(dafnyCode);
    }
  }, [runVerification, fileState.activeFile]);

  const handleGenerateSpec = useCallback(async () => {
    setIsTerminalCollapsed(false);
    // Get markdown content from active file
    const markdownContent = fileState.activeFile?.fileType === 'md' ? fileState.activeFile.content : '';
    if (markdownContent && fileState.activeFile?.id) {
      await generateSpec(markdownContent, fileState.activeFile.id, fileState.activeFile.filename);
    }
  }, [generateSpec, fileState.activeFile]);

  const handleFileSelect = useCallback((fileId: string) => {
    selectFile(fileId);
    setActiveReference(null);
  }, [selectFile]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "edit") {
      setActiveReference(null);
    }
  }, []);

  // Resize handlers for edit mode split pane
  const [isResizing, setIsResizing] = useState(false);
  const splitPaneRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !splitPaneRef.current) return;

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      const containerRect = splitPaneRef.current!.getBoundingClientRect();
      const mouseX = e.clientX;
      const relativeX = mouseX - containerRect.left;
      const percentage = (relativeX / containerRect.width) * 100;

      const constrainedPercentage = Math.max(20, Math.min(70, 100 - percentage));
      setRightPaneWidth(constrainedPercentage);
    });
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  // Resize handlers for trace mode split pane
  const [isResizingTrace, setIsResizingTrace] = useState(false);
  const traceSplitPaneRef = useRef<HTMLDivElement>(null);

  const handleTraceResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingTrace(true);
  }, []);

  const handleTraceResize = useCallback((e: MouseEvent) => {
    if (!isResizingTrace || !traceSplitPaneRef.current) return;

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      const containerRect = traceSplitPaneRef.current!.getBoundingClientRect();
      const mouseX = e.clientX;
      const relativeX = mouseX - containerRect.left;
      const percentage = (relativeX / containerRect.width) * 100;

      const constrainedPercentage = Math.max(30, Math.min(70, percentage));
      setTracePaneWidth(constrainedPercentage);
    });
  }, [isResizingTrace]);

  const handleTraceResizeEnd = useCallback(() => {
    setIsResizingTrace(false);
  }, []);

  useEffect(() => {
    if (isResizingTrace) {
      window.addEventListener('mousemove', handleTraceResize);
      window.addEventListener('mouseup', handleTraceResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        window.removeEventListener('mousemove', handleTraceResize);
        window.removeEventListener('mouseup', handleTraceResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingTrace, handleTraceResize, handleTraceResizeEnd]);

  // Resize handlers for terminal panel
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const handleTerminalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingTerminal(true);
  }, []);

  const handleTerminalResize = useCallback((e: MouseEvent) => {
    if (!isResizingTerminal) return;

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      // Calculate height from bottom of viewport
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;
      const heightFromBottom = viewportHeight - mouseY;

      const constrainedHeight = Math.max(100, Math.min(600, heightFromBottom));
      setTerminalHeight(constrainedHeight);
    });
  }, [isResizingTerminal]);

  const handleTerminalResizeEnd = useCallback(() => {
    setIsResizingTerminal(false);
  }, []);

  useEffect(() => {
    if (isResizingTerminal) {
      window.addEventListener('mousemove', handleTerminalResize);
      window.addEventListener('mouseup', handleTerminalResizeEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        window.removeEventListener('mousemove', handleTerminalResize);
        window.removeEventListener('mouseup', handleTerminalResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingTerminal, handleTerminalResize, handleTerminalResizeEnd]);

  // Resize handlers for explorer panel
  const handleExplorerResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingExplorer(true);
  }, []);

  const handleExplorerResize = useCallback((e: MouseEvent) => {
    if (!isResizingExplorer) return;

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      const mouseX = e.clientX;
      // Constrain between 150px (min) and 400px (max)
      const constrainedWidth = Math.max(150, Math.min(400, mouseX));
      setExplorerWidth(constrainedWidth);
    });
  }, [isResizingExplorer]);

  const handleExplorerResizeEnd = useCallback(() => {
    setIsResizingExplorer(false);
  }, []);

  useEffect(() => {
    if (isResizingExplorer) {
      window.addEventListener('mousemove', handleExplorerResize);
      window.addEventListener('mouseup', handleExplorerResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        window.removeEventListener('mousemove', handleExplorerResize);
        window.removeEventListener('mouseup', handleExplorerResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingExplorer, handleExplorerResize, handleExplorerResizeEnd]);

  // Check if current file has units (for Root determination)
  // Must be before early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!fileState.files || !selectedFile) {
      setIsRootFile(false);
      return;
    }
    const isMarkdownFile = fileState.files.find(f => f.file_id === selectedFile)?.file_type === 'md';
    if (isMarkdownFile) {
      hasUnits(selectedFile).then(setIsRootFile).catch(() => setIsRootFile(false));
    } else {
      setIsRootFile(false);
    }
  }, [selectedFile, fileState.files, hasUnits]);

  // Show loading state or redirect if no projectId
  if (!projectId) {
    return null; // Will redirect in useEffect
  }

  if (projectState.isLoading || !projectState.currentProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  const isMarkdownFile = selectedFile && fileState.files.find(f => f.file_id === selectedFile)?.file_type === 'md';
  const isDafnyFile = selectedFile && fileState.files.find(f => f.file_id === selectedFile)?.file_type === 'dfy';
  const errorCount = verificationState.proofObligations.filter(po => po.status === 'failed').length;

  // Trace Mode
  if (viewMode === "trace") {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header
          onRunVerification={handleRunVerification}
          isVerifying={verificationState.isVerifying}
          showVerification={true}
          hasProject={true}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <div className="flex flex-1 overflow-hidden">
          <ProjectExplorer
            selectedFile={selectedFile || ''}
            onFileSelect={handleFileSelect}
            isCollapsed={isExplorerCollapsed}
            onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
            hasProject={projectState.hasProject}
            width={isExplorerCollapsed ? undefined : explorerWidth}
            isResizing={isResizingExplorer}
          />
          {!isExplorerCollapsed && (
            <div
              className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
              onMouseDown={handleExplorerResizeStart}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
            </div>
          )}
          <div ref={traceSplitPaneRef} className="flex flex-1 overflow-hidden">
            <TraceabilityView
              selectedFile={selectedFile || ''}
              activeReference={activeReference}
              onReferenceClick={setActiveReference}
              leftPaneWidth={tracePaneWidth}
              isResizing={isResizingTrace}
              onResizeStart={handleTraceResizeStart}
              projectFiles={fileState.projectFiles}
            />
          </div>
        </div>
        {!isTerminalCollapsed && (
          <div
            className="group flex h-1 cursor-row-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
            onMouseDown={handleTerminalResizeStart}
          >
            <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground/30 group-hover:text-primary" />
          </div>
        )}
        <TerminalPanel
          isCollapsed={isTerminalCollapsed}
          onToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
          isGenerating={projectState.isGenerating}
          height={isTerminalCollapsed ? undefined : terminalHeight}
          isResizing={isResizingTerminal}
        />
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header
        onRunVerification={handleRunVerification}
        isVerifying={verificationState.isVerifying}
        showVerification={!!isDafnyFile}
        hasProject={true}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <ProjectExplorer
          selectedFile={selectedFile || ''}
          onFileSelect={handleFileSelect}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
          hasProject={projectState.hasProject}
          width={isExplorerCollapsed ? undefined : explorerWidth}
        />
        {!isExplorerCollapsed && (
          <div
            className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
            onMouseDown={handleExplorerResizeStart}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
          </div>
        )}
        {isMarkdownFile ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <MarkdownEditor
              onGenerateSpec={handleGenerateSpec}
              isGenerating={projectState.isGenerating}
              isRootFile={isRootFile}
            />
          </div>
        ) : isDafnyFile ? (
          <div ref={splitPaneRef} className="flex flex-1 overflow-hidden">
            <div
              className={cn(
                "flex min-w-0 flex-col border-r border-border transition-all duration-300",
                isResizing && "transition-none"
              )}
              style={{ width: `${100 - rightPaneWidth}%` }}
            >
              <CodeEditor selectedFile={selectedFile || ''} />
            </div>
            <div
              className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
              onMouseDown={handleResizeStart}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-col overflow-hidden",
                isResizing && "transition-none"
              )}
              style={{ width: `${rightPaneWidth}%` }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full w-full flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center border-b border-border bg-secondary/30">
                  <TabsList className="h-9 w-full justify-start gap-0 rounded-none bg-transparent p-0">
                    <TabsTrigger
                      value="verification"
                      className="relative h-9 gap-1.5 rounded-none border-r border-border bg-transparent px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verification
                      {errorCount > 0 && (
                        <span className="ml-1 rounded bg-destructive/20 px-1 py-0.5 text-[10px] font-medium text-destructive">
                          {errorCount}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="gemini"
                      className="relative h-9 gap-1.5 rounded-none border-r border-border bg-transparent px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Gemini Insight
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="verification" className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
                  <VerificationPanel />
                </TabsContent>
                <TabsContent value="gemini" className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
                  <GeminiInsightPanel />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a file to view
          </div>
        )}
      </div>
      {!isTerminalCollapsed && (
        <div
          className="group flex h-1 cursor-row-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50 active:bg-primary/70"
          onMouseDown={handleTerminalResizeStart}
        >
          <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground/30 group-hover:text-primary" />
        </div>
      )}
      <TerminalPanel
        isCollapsed={isTerminalCollapsed}
        onToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
        isGenerating={projectState.isGenerating || projectState.isDeconstructing}
        height={isTerminalCollapsed ? undefined : terminalHeight}
        isResizing={isResizingTerminal}
      />
    </div>
  );
}
