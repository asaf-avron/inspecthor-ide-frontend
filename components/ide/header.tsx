"use client";

import { Play, ChevronDown, HelpCircle, Eye, Edit3, Github, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "@/components/auth/user-menu";
import { LoginModal } from "@/components/auth/login-modal";
import { BlueprintInitModal } from "@/components/blueprint/init-modal";
import { useAuth } from "@/lib/auth-context";
import { useGitHub } from "@/lib/github-context";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

export type ViewMode = "trace" | "edit";

interface HeaderProps {
  onRunVerification: () => void;
  isVerifying: boolean;
  showVerification?: boolean;
  hasBlueprint?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function Header({
  onRunVerification,
  isVerifying,
  showVerification = true,
  hasBlueprint = true,
  viewMode = "edit",
  onViewModeChange,
}: HeaderProps) {
  const { isAuthenticated, login } = useAuth();
  const { installations, fetchInstallations } = useGitHub();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlueprintInitModal, setShowBlueprintInitModal] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using theme after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch installations when authenticated
  useEffect(() => {
    if (isAuthenticated && installations.length === 0) {
      fetchInstallations();
    }
  }, [isAuthenticated, installations.length, fetchInstallations]);

  // Get the first installation ID (or 0 if none)
  const installationId = installations[0]?.installation_id || 0;

  return (
    <>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        trigger="general"
      />
      <BlueprintInitModal
        open={showBlueprintInitModal}
        onOpenChange={setShowBlueprintInitModal}
        installationId={installationId}
        onSuccess={(response) => {
          console.log("Blueprint initialized:", response);
        }}
      />
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-1">
        {/* Left: Logo */}
        <div className="flex items-center gap-1">
          <Image
            src={mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png"}
            alt="Guardian Gateway Logo"
            width={64}
            height={64}
            className="h-12 w-12 object-contain"
            priority
          />

          {/* Navigation */}
          {hasBlueprint && (
            <nav className="hidden items-center gap-1 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                    File
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>New Specification</DropdownMenuItem>
                  <DropdownMenuItem>Open Project...</DropdownMenuItem>
                  <DropdownMenuItem>Open Recent</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Save</DropdownMenuItem>
                  <DropdownMenuItem>Save All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                    Edit
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Undo</DropdownMenuItem>
                  <DropdownMenuItem>Redo</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Find</DropdownMenuItem>
                  <DropdownMenuItem>Replace</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                    View
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Explorer</DropdownMenuItem>
                  <DropdownMenuItem>Search</DropdownMenuItem>
                  <DropdownMenuItem>Problems</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Terminal</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}
        </div>

        {/* Center: View Mode Toggle */}
        {hasBlueprint && onViewModeChange && (
          <div className="flex items-center">
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5">
              <button
                onClick={() => onViewModeChange("trace")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                  viewMode === "trace"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                Trace
              </button>
              <button
                onClick={() => onViewModeChange("edit")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                  viewMode === "edit"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Initialize Blueprint Button - for creating new verified projects */}
          {isAuthenticated && (
            <Button
              onClick={() => setShowBlueprintInitModal(true)}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              title="Initialize a new verified project in GitHub"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Init Blueprint</span>
            </Button>
          )}

          {/* Run Verification Button - appears before help/user section */}
          {hasBlueprint && showVerification && (
            <>
              <Button
                onClick={onRunVerification}
                disabled={isVerifying}
                size="sm"
                className="h-7 gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Play className={`h-3.5 w-3.5 ${isVerifying ? "animate-pulse" : ""}`} />
                <span>{isVerifying ? "Verifying..." : "Run Verification"}</span>
              </Button>
              <div className="mx-2 h-4 w-px bg-border" />
            </>
          )}

          {/* Help Icon - fixed position */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-7 w-7 p-0 text-muted-foreground hover:text-foreground sm:flex"
            onClick={() => window.open('https://docs.example.com', '_blank')}
            title="Documentation"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Auth Button or User Menu - fixed position */}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowLoginModal(true)}
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign in with GitHub</span>
            </Button>
          )}
        </div>
      </header>
    </>
  );
}
