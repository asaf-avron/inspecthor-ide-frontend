"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Sparkles, ArrowRight, FolderUp, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ZeroStateProps {
  onUploadRequirements: (content?: string) => void | Promise<void>;
  onNewManualSpec: () => void | Promise<void>;
  onGenerateWithAI: (prompt: string) => void | Promise<void>;
}

export function ZeroState({ 
  onUploadRequirements, 
  onNewManualSpec, 
  onGenerateWithAI 
}: ZeroStateProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileContent = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validExtensions = ['.md', '.txt', '.markdown'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      alert('Please upload a .md, .txt, or .markdown file');
      return;
    }

    setIsLoading(true);
    try {
      const content = await readFileContent(file);
      await onUploadRequirements(content);
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('Failed to read file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [readFileContent, onUploadRequirements]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileUpload(e.dataTransfer.files);
  };

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(e.target.files);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background p-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Guardian Gateway
        </h1>
        <p className="text-sm text-muted-foreground">
          Transform your requirements into formally verified specifications
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.markdown"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Upload Requirements Card */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/50",
            isDragging && "border-primary bg-primary/10",
            isLoading && "pointer-events-none opacity-70"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleCardClick}
        >
          <CardHeader className="pb-2">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              ) : (
                <Upload className="h-6 w-6 text-blue-400" />
              )}
            </div>
            <CardTitle className="text-base">Upload Requirements</CardTitle>
            <CardDescription className="text-xs">
              Drag & drop your requirements document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={cn(
                "flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors",
                isDragging && "border-primary bg-primary/5"
              )}
            >
              <FolderUp className="mb-2 h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
<<<<<<< HEAD
                .md, .txt, .markdown
=======
                .md, .txt, .pdf
>>>>>>> origin/main
              </span>
            </div>
          </CardContent>
        </Card>

        {/* New Manual Spec Card */}
        <Card 
          className="cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/50"
          onClick={() => {
            console.log("New Manual Spec clicked!");
            onNewManualSpec();
          }}
        >
          <CardHeader className="pb-2">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">New Manual Spec</CardTitle>
            <CardDescription className="text-xs">
              Start with a blank Markdown editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-border bg-secondary/30">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-16 rounded bg-muted-foreground/20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded bg-muted-foreground/20" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-20 rounded bg-muted-foreground/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate with AI Card */}
        <Card className="transition-all hover:border-primary/50 hover:bg-secondary/50">
          <CardHeader className="pb-2">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <CardTitle className="text-base">Generate with AI</CardTitle>
            <CardDescription className="text-xs">
              Describe your feature to scaffold a spec
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="A token contract with minting limits..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim()) {
                    onGenerateWithAI(aiPrompt);
                  }
                }}
              />
              <Button
                onClick={() => aiPrompt.trim() && onGenerateWithAI(aiPrompt)}
                disabled={!aiPrompt.trim()}
                size="sm"
                className="h-8 w-full gap-1.5 bg-gradient-to-r from-violet-500 to-primary text-xs font-medium text-foreground hover:from-violet-500/90 hover:to-primary/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Scaffold Spec
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Your specifications will be formally verified using Dafny
      </p>
    </div>
  );
}
