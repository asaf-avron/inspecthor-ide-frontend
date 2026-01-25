"use client";

import { Shield, Wallet, Play, ChevronDown, Settings, HelpCircle, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onRunVerification: () => void;
  isVerifying: boolean;
}

export function Header({ onRunVerification, isVerifying }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Guardian Gateway</span>
        </div>

        {/* Navigation */}
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
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="hidden h-7 w-7 p-0 text-muted-foreground hover:text-foreground sm:flex">
          <Github className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden h-7 w-7 p-0 text-muted-foreground hover:text-foreground sm:flex">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden h-7 w-7 p-0 text-muted-foreground hover:text-foreground sm:flex">
          <Settings className="h-4 w-4" />
        </Button>

        <div className="mx-2 hidden h-4 w-px bg-border sm:block" />

        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground">
          <Wallet className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>

        <Button
          onClick={onRunVerification}
          disabled={isVerifying}
          size="sm"
          className="h-7 gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Play className={`h-3.5 w-3.5 ${isVerifying ? "animate-pulse" : ""}`} />
          <span>{isVerifying ? "Verifying..." : "Run Verification"}</span>
        </Button>
      </div>
    </header>
  );
}
