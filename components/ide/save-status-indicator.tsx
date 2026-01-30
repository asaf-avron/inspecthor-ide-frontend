"use client";

import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/lib/types";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatusIndicator({ 
  status, 
  onRetry,
  className 
}: SaveStatusIndicatorProps) {
  switch (status) {
    case "clean":
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <CheckCircle2 className="h-3 w-3 text-primary/60 animate-in fade-in duration-300" />
        </div>
      );
    
    case "dirty":
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <Circle className="h-2 w-2 fill-warning text-warning" />
        </div>
      );
    
    case "saving":
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Saving...</span>
        </div>
      );
    
    case "error":
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <AlertCircle className="h-3 w-3 text-destructive" />
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] text-destructive hover:underline"
              title="Retry save"
            >
              Retry
            </button>
          )}
        </div>
      );
    
    default:
      return null;
  }
}
