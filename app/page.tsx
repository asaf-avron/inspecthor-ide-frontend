"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/ide/header";
import { ProjectExplorer } from "@/components/ide/project-explorer";
import { CodeEditor } from "@/components/ide/code-editor";
import { MarkdownEditor } from "@/components/ide/markdown-editor";
import { VerificationPanel } from "@/components/ide/verification-panel";
import { GeminiInsightPanel } from "@/components/ide/gemini-insight-panel";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GuardianGatewayIDE() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("verification");
  const [selectedFile, setSelectedFile] = useState("requirements.md");

  const handleRunVerification = useCallback(() => {
    setIsVerifying(true);
    setIsTerminalCollapsed(false);
    setTimeout(() => {
      setIsVerifying(false);
    }, 3000);
  }, []);

  const handleGenerateSpec = useCallback(() => {
    setIsGeneratingSpec(true);
    setIsTerminalCollapsed(false);
    
    // Simulate generation then transition to spec.dfy
    setTimeout(() => {
      setIsGeneratingSpec(false);
      setSelectedFile("spec.dfy");
    }, 2000);
  }, []);

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFile(fileId);
  }, []);

  const isMarkdownFile = selectedFile.endsWith(".md");
  const isDafnyFile = selectedFile.endsWith(".dfy");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header 
        onRunVerification={handleRunVerification} 
        isVerifying={isVerifying}
        showVerification={isDafnyFile}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Explorer Sidebar */}
        <ProjectExplorer
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
        />

        {/* Main Editor Area */}
        {isMarkdownFile ? (
          /* Markdown View - Full Width */
          <div className="flex flex-1 flex-col overflow-hidden">
            <MarkdownEditor 
              onGenerateSpec={handleGenerateSpec}
              isGenerating={isGeneratingSpec}
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
                      <span className="ml-1 rounded bg-destructive/20 px-1 py-0.5 text-[10px] font-medium text-destructive">
                        1
                      </span>
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
        isGenerating={isGeneratingSpec}
      />
    </div>
  );
}
