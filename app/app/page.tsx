"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, ViewMode } from "@/components/ide/header";
import { ProjectExplorer } from "@/components/ide/project-explorer";
import { ProjectsDashboard } from "@/components/ide/projects-dashboard";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { useState, useCallback } from "react";
import { useProject } from "@/lib/project-context";

export default function IDEHomePage() {
  const router = useRouter();
  const { state, checkHealth, resetProject } = useProject();
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Clear project state when navigating to dashboard (only on mount)
  useEffect(() => {
    resetProject();
  }, [resetProject]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Show loading if checking for existing project
  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header 
        onRunVerification={() => {}}
        isVerifying={false}
        showVerification={false}
        hasProject={false}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Explorer Sidebar */}
        <ProjectExplorer
          selectedFile=""
          onFileSelect={() => {}}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
          hasProject={false}
        />

        {/* Projects Dashboard */}
        <ProjectsDashboard />
      </div>

      {/* Bottom Panel - Terminal */}
      <TerminalPanel
        isCollapsed={isTerminalCollapsed}
        onToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
        isGenerating={false}
      />
    </div>
  );
}
