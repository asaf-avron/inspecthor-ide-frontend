"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header, ViewMode } from "@/components/ide/header";
import { BlueprintExplorer } from "@/components/ide/blueprint-explorer";
import { BlueprintsDashboard } from "@/components/ide/blueprints-dashboard";
import { TerminalPanel } from "@/components/ide/terminal-panel";
import { useBlueprint } from "@/lib/blueprint-context";

export default function IDEHomePage() {
  const router = useRouter();
  const { state, checkHealth, resetBlueprint } = useBlueprint();
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Clear blueprint state when navigating to dashboard (only on mount)
  useEffect(() => {
    resetBlueprint();
  }, [resetBlueprint]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Show loading if checking for existing blueprint
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
        onRunVerification={() => { }}
        isVerifying={false}
        showVerification={false}
        hasBlueprint={false}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Blueprint Explorer Sidebar */}
        <BlueprintExplorer
          selectedFile=""
          onFileSelect={() => { }}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
          hasBlueprint={false}
        />

        {/* Blueprints Dashboard */}
        <BlueprintsDashboard />
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
