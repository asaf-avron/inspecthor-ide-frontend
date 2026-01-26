"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Send, User, ChevronDown, Lightbulb, Code2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/project-context";
import type { ChatMessage } from "@/lib/types";

interface Message extends ChatMessage {
  id: string;
  suggestions?: string[];
}

export function GeminiInsightPanel() {
  const { state, sendChatMessage } = useProject();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Build context from verification errors
  const verificationContext = useMemo(() => {
    if (!state.verificationResults?.errors?.length) return null;
    
    const firstError = state.verificationResults.errors[0];
    return {
      code: state.dafnyCode.split('\n').slice(
        Math.max(0, firstError.line - 5),
        firstError.line + 5
      ).join('\n'),
      location: `Line ${firstError.line}:${firstError.column}`,
      error: firstError.message,
    };
  }, [state.verificationResults, state.dafnyCode]);

  // Generate initial message based on verification results
  useEffect(() => {
    if (state.verificationResults && messages.length === 0) {
      const errors = state.verificationResults.errors;
      
      if (errors && errors.length > 0) {
        const initialMessage: Message = {
          id: 'initial',
          role: 'assistant',
          content: `I've detected **${errors.length} verification error${errors.length > 1 ? 's' : ''}** in your specification.

**First error at line ${errors[0].line}:**
\`${errors[0].message}\`

I can help you understand and fix these issues. What would you like to know?`,
          suggestions: [
            "Explain this error",
            "How do I fix this?",
            "Show related proof obligations",
          ],
        };
        setMessages([initialMessage]);
      } else if (state.verificationResults.verified) {
        const successMessage: Message = {
          id: 'initial',
          role: 'assistant',
          content: `Great news! All verification checks passed in **${state.verificationResults.verification_time_ms}ms**.

Your specification is formally verified. Would you like me to explain any of the proof obligations or help you extend the specification?`,
          suggestions: [
            "Explain the proof strategy",
            "How can I add more properties?",
            "What are the verified invariants?",
          ],
        };
        setMessages([successMessage]);
      }
    }
  }, [state.verificationResults, messages.length]);

  // Show welcome message if no verification yet
  useEffect(() => {
    if (!state.verificationResults && messages.length === 0 && state.hasProject) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your verification assistant powered by Gemini AI.

I can help you:
- **Debug** verification failures
- **Explain** proof obligations
- **Suggest** fixes for specification gaps
- **Answer** questions about Dafny and formal verification

Run verification on your Dafny code, and I'll automatically analyze any errors.`,
        suggestions: [
          "How does formal verification work?",
          "Explain Dafny syntax",
          "What are common verification errors?",
        ],
      }]);
    }
  }, [state.hasProject, state.verificationResults, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      const response = await sendChatMessage(input, verificationContext || undefined);
      
      if (response) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          suggestions: response.suggestions.length > 0 ? response.suggestions : undefined,
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        // Error response already added by context
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
        };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Verification Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {!state.geminiConfigured && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="h-3 w-3" />
              <span>Gemini not configured</span>
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground">
            <span>gemini-2.0-flash</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Context Badge */}
      {verificationContext && (
        <div className="border-b border-border bg-secondary/30 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Context:</span>
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-destructive">
              {verificationContext.location}: {verificationContext.error.slice(0, 50)}...
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-start gap-2">
                {message.role === "assistant" ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent">
                    <User className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground">
                    <MessageContent content={message.content} />
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {message.suggestions && message.role === "assistant" && (
                <div className="ml-8 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-foreground"
                    >
                      <Lightbulb className="h-3 w-3" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Analyzing</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about verification, Dafny, or your specification..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            disabled={!input.trim() || isThinking}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like parsing
  const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const language = match?.[1] || 'dafny';
          const code = match?.[2] || part.replace(/```\w*\n?/g, "").replace(/```$/g, "");
          return (
            <div key={i} className="my-2 rounded border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
                <Code2 className="h-3 w-3" />
                <span>{language}</span>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-foreground">{code.trim()}</pre>
            </div>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-secondary px-1 py-0.5 font-mono text-xs text-primary">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
