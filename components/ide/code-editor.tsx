"use client";

import { useState, useCallback, useMemo } from "react";
import { File, X, ChevronRight, Save } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  selectedFile?: string;
}

export function CodeEditor({ selectedFile = "spec.dfy" }: CodeEditorProps) {
  const { state, setDafnyCode, saveFile } = useProject();
  const [activeTab, setActiveTab] = useState(selectedFile === "utils.dfy" ? "Utils.dfy" : "Spec.dfy");
  const [localCode, setLocalCode] = useState(state.dafnyCode);

  // Sync local code when context changes
  useMemo(() => {
    if (state.dafnyCode && state.dafnyCode !== localCode) {
      setLocalCode(state.dafnyCode);
    }
  }, [state.dafnyCode]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    setDafnyCode(newCode);
  }, [setDafnyCode]);

  const handleSave = useCallback(async () => {
    try {
      await saveFile('spec.dfy', localCode, 'dafny');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [saveFile, localCode]);

  // Use local code or context code or default
  const displayCode = localCode || state.dafnyCode || defaultDafnyCode;
  const codeLines = displayCode.split("\n");

  // Find error lines from verification results
  const errorLines = useMemo(() => {
    const lines = new Set<number>();
    if (state.verificationResults?.errors) {
      for (const error of state.verificationResults.errors) {
        lines.add(error.line);
      }
    }
    return lines;
  }, [state.verificationResults]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-secondary/30">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("Spec.dfy")}
            className={`group flex h-9 items-center gap-2 border-r border-border px-3 text-xs ${
              activeTab === "Spec.dfy"
                ? "bg-background text-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <File className="h-3.5 w-3.5 text-primary" />
            <span>Spec.dfy</span>
            <X className="h-3 w-3 opacity-0 group-hover:opacity-60" />
          </button>
          {state.projectFiles.some(f => f.children?.some(c => c.id === 'utils.dfy')) && (
            <button
              onClick={() => setActiveTab("Utils.dfy")}
              className={`group flex h-9 items-center gap-2 border-r border-border px-3 text-xs ${
                activeTab === "Utils.dfy"
                  ? "bg-background text-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <File className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Utils.dfy</span>
              <X className="h-3 w-3 opacity-0 group-hover:opacity-60" />
            </button>
          )}
        </div>
        
        {/* Save Button */}
        <div className="pr-2">
          <Button
            onClick={handleSave}
            disabled={state.isSaving}
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Save className="h-3.5 w-3.5" />
            {state.isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex h-6 items-center gap-1 border-b border-border bg-secondary/20 px-3 text-[11px] text-muted-foreground">
        <span>Root Spec</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{activeTab}</span>
        {state.verificationResults && (
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            state.verificationResults.verified 
              ? "bg-primary/20 text-primary" 
              : "bg-destructive/20 text-destructive"
          }`}>
            {state.verificationResults.verified ? "Verified" : "Failed"}
          </span>
        )}
      </div>

      {/* Code Area - Editable */}
      <div className="relative flex-1 overflow-auto">
        <div className="flex min-w-max font-mono text-[13px] leading-5">
          {/* Line Numbers */}
          <div className="sticky left-0 z-10 flex flex-col bg-background pr-2 text-right text-muted-foreground/60 select-none">
            {codeLines.map((_, i) => (
              <div 
                key={i} 
                className={`px-3 ${errorLines.has(i + 1) ? "bg-destructive/20 text-destructive" : ""}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Content - Textarea overlay */}
          <div className="relative flex-1">
            {/* Syntax highlighted background */}
            <pre className="pointer-events-none absolute inset-0 pl-2 text-foreground">
              {codeLines.map((line, i) => (
                <div 
                  key={i} 
                  className={`${errorLines.has(i + 1) ? "bg-destructive/20" : "hover:bg-accent/30"}`}
                >
                  <CodeLine line={line} isError={errorLines.has(i + 1)} />
                </div>
              ))}
            </pre>
            
            {/* Editable textarea */}
            <textarea
              value={localCode || displayCode}
              onChange={handleCodeChange}
              className="absolute inset-0 resize-none bg-transparent pl-2 font-mono text-[13px] leading-5 text-transparent caret-foreground focus:outline-none"
              spellCheck={false}
              style={{ caretColor: 'white' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeLine({ line, isError }: { line: string; isError?: boolean }) {
  // Simple syntax highlighting for Dafny
  const highlightedLine = line
    .replace(/(\/\/.*$)/g, '<span class="text-muted-foreground/70">$1</span>')
    .replace(/\b(module|datatype|predicate|method|lemma|function|returns|requires|ensures|forall|exists|calc|include|var|if|else|while|match|case|ghost|class|trait|type|const)\b/g, '<span class="text-[#c586c0]">$1</span>')
    .replace(/\b(map|seq|set|multiset|array|int|nat|real|bool|string|char|object)\b/g, '<span class="text-[#4ec9b0]">$1</span>')
    .replace(/\b(true|false|null|old|fresh|in|this)\b/g, '<span class="text-[#569cd6]">$1</span>')
    .replace(/(".*?")/g, '<span class="text-[#ce9178]">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>');

  return (
    <code 
      className={isError ? "block" : ""}
      dangerouslySetInnerHTML={{ __html: highlightedLine || "&nbsp;" }} 
    />
  );
}

// Default Dafny code when no spec is generated
const defaultDafnyCode = `// spec.dfy - Generated Dafny Specification
// Run "Generate Formal Spec" from the Markdown editor to generate code

module Specification {
  // Your specification will appear here after generation
  
  // Example structure:
  // datatype State = State(...)
  // 
  // predicate ValidState(s: State) { ... }
  // 
  // method Operation(...) returns (...)
  //   requires ...
  //   ensures ...
  // { ... }
}
`;
