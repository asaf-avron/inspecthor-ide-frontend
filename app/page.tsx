"use client";

import { useState, useCallback, useEffect } from "react";
import { Header, ViewMode } from "@/components/ide/header";
import { ProjectExplorer } from "@/components/ide/project-explorer";
import { CodeEditor } from "@/components/ide/code-editor";
import { MarkdownEditor } from "@/components/ide/markdown-editor";
import { VerificationPanel } from "@/components/ide/verification-panel";
import { GeminiInsightPanel } from "@/components/ide/gemini-insight-panel";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { ZeroState } from "@/components/ide/zero-state";
import { TraceabilityView } from "@/components/ide/traceability-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/project-context";

export default function GuardianGatewayIDE() {
  const { 
    state, 
    checkHealth,
    createProject,
    selectFile,
    generateSpec,
    runVerification,
    setDeconstructing,
    addLog,
  } = useProject();

  // Local UI state (not persisted)
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("verification");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [activeReference, setActiveReference] = useState<string | null>(null);

  // Derive selected file from context or default
  const selectedFile = state.selectedFileId || "requirements.md";

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleRunVerification = useCallback(async () => {
    setIsTerminalCollapsed(false);
    await runVerification(state.dafnyCode);
  }, [runVerification, state.dafnyCode]);

  const handleGenerateSpec = useCallback(async () => {
    setIsTerminalCollapsed(false);
    await generateSpec(state.markdownContent);
    // Switch to the generated Dafny file
    selectFile("spec.dfy");
  }, [generateSpec, state.markdownContent, selectFile]);

  const handleDeconstructToUnits = useCallback(() => {
    setDeconstructing(true);
    setIsTerminalCollapsed(false);
    addLog('info', 'Deconstructing specification into units...');
    
    // Simulate deconstruction (backend endpoint not yet implemented)
    setTimeout(() => {
      setDeconstructing(false);
      addLog('success', 'Deconstruction complete');
    }, 2500);
  }, [setDeconstructing, addLog]);

  const handleFileSelect = useCallback((fileId: string) => {
    selectFile(fileId);
    // Reset active reference when changing files
    setActiveReference(null);
  }, [selectFile]);

  const handleUploadRequirements = useCallback(async (content?: string) => {
    const defaultContent = `# Requirements Specification

## Overview
Describe your system requirements here.

## Functional Requirements

### FR-1: Core Functionality
- **FR-1.1**: Users MUST be able to...
- **FR-1.2**: The system MUST...

## Security Invariants

### SI-1: Data Integrity
- All data MUST be validated before processing
`;
    
    await createProject(content || defaultContent);
    setIsTerminalCollapsed(false);
  }, [createProject]);

  const handleNewManualSpec = useCallback(async () => {
    await handleUploadRequirements();
  }, [handleUploadRequirements]);

  const handleGenerateWithAI = useCallback(async (prompt: string) => {
    // Create a project with the AI prompt as initial content
    const content = `# AI-Generated Requirements

## User Prompt
${prompt}

## Generated Requirements
(Generating specification based on prompt...)
`;
    await createProject(content);
    setIsTerminalCollapsed(false);
    
    // Immediately trigger spec generation
    setTimeout(async () => {
      await generateSpec(prompt);
    }, 500);
  }, [createProject, generateSpec]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // Reset active reference when switching modes
    if (mode === "edit") {
      setActiveReference(null);
    }
  }, []);

  const handleReferenceClick = useCallback((refId: string | null) => {
    setActiveReference(refId);
  }, []);

  const isMarkdownFile = selectedFile.endsWith(".md");
  const isDafnyFile = selectedFile.endsWith(".dfy");

  // Count verification errors for badge
  const errorCount = state.proofObligations.filter(po => po.status === 'failed').length;

  // Zero State - No Project Loaded
  if (!state.hasProject) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header 
          onRunVerification={handleRunVerification} 
          isVerifying={state.isVerifying}
          showVerification={false}
          hasProject={false}
        />
        <ZeroState
          onUploadRequirements={handleUploadRequirements}
          onNewManualSpec={handleNewManualSpec}
          onGenerateWithAI={handleGenerateWithAI}
        />
      </div>
    );
  }

  // Trace Mode - Traceability View
  if (viewMode === "trace") {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Header */}
        <Header 
          onRunVerification={handleRunVerification} 
          isVerifying={state.isVerifying}
          showVerification={true}
          hasProject={true}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Project Explorer Sidebar */}
          <ProjectExplorer
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            isCollapsed={isExplorerCollapsed}
            onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
            hasProject={state.hasProject}
          />

          {/* Traceability Split Pane */}
          <TraceabilityView
            selectedFile={selectedFile}
            activeReference={activeReference}
            onReferenceClick={handleReferenceClick}
          />
        </div>

        {/* Bottom Panel - Terminal */}
          <TerminalPanel
          isCollapsed={isTerminalCollapsed}
          onToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
          isGenerating={state.isGenerating}
        />
      </div>
    );
  }

  // Edit Mode - Standard Editor View
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header 
        onRunVerification={handleRunVerification} 
        isVerifying={state.isVerifying}
        showVerification={isDafnyFile}
        hasProject={true}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Explorer Sidebar */}
        <ProjectExplorer
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
<<<<<<< HEAD
          hasProject={state.hasProject}
=======
          hasProject={hasProject}
>>>>>>> origin/main
        />

        {/* Main Editor Area */}
        {isMarkdownFile ? (
          /* Markdown View - Full Width */
          <div className="flex flex-1 flex-col overflow-hidden">
            <MarkdownEditor 
              onGenerateSpec={handleGenerateSpec}
<<<<<<< HEAD
              isGenerating={state.isGenerating}
              isRootFile={selectedFile === "requirements.md"}
              onDeconstructToUnits={handleDeconstructToUnits}
              isDeconstructing={state.isDeconstructing}
=======
              isGenerating={isGeneratingSpec}
              isRootFile={selectedFile === "requirements.md"}
              onDeconstructToUnits={handleDeconstructToUnits}
              isDeconstructing={isDeconstructing}
>>>>>>> origin/main
            />
          </div>
        ) : (
          /* Dafny View - Split Pane */
          <>
            {/* Left Pane - Code Editor (60%) */}
            <div 
              className={cn(
                "flex min-w-0 flex-col border-r border-border transition-all duration-300",
                "w-[60%]"
              )}
            >
              <CodeEditor selectedFile={selectedFile} />
            </div>

            {/* Resize Handle */}
            <div className="group flex w-1 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-primary/50">
              <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary" />
            </div>

            {/* Right Pane - Tabbed Interface (40%) */}
            <div className="flex w-[40%] min-w-0 flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                {/* Tab Headers */}
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

                {/* Tab Content */}
                <TabsContent value="verification" className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
                  <VerificationPanel />
                </TabsContent>
                <TabsContent value="gemini" className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
                  <GeminiInsightPanel />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>

      {/* Bottom Panel - Terminal */}
      <TerminalPanel
        isCollapsed={isTerminalCollapsed}
        onToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
        isGenerating={state.isGenerating || state.isDeconstructing}
      />
    </div>
  );
}
