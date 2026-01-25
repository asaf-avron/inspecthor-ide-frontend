"use client";

import React from "react"

import { useState } from "react";
import { Sparkles, Send, User, ChevronDown, Lightbulb, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: `I've analyzed the verification failure at **Spec.dfy:28**.

**Issue:** The postcondition \`ValidState(newState)\` cannot be verified because the solver found a potential counterexample.

**Root Cause:** When the \`to\` address is not present in the original \`balances\` map, the \`GetOrDefault\` call returns 0, but the verification cannot establish that adding a new entry preserves the invariant \`SumBalances(balances) == totalSupply\`.

**Why it fails:** The \`SumBalances\` function iterates over map keys. When you add a new key-value pair, you need to explicitly prove that:
1. The new key wasn't counted before
2. The sum increases exactly by the new value

**Suggested fix:** Add a helper lemma that establishes the relationship between \`SumBalances\` and map updates:`,
    suggestions: [
      "Show me the suggested lemma code",
      "Explain SumBalances in more detail",
      "What are other ways to fix this?",
    ],
  },
];

export function GeminiInsightPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Here's the helper lemma you need to add:

\`\`\`dafny
lemma SumBalancesUpdate(
  m: map<address, uint256>, 
  key: address, 
  oldVal: uint256, 
  newVal: uint256
)
  requires key in m
  requires m[key] == oldVal
  ensures SumBalances(m[key := newVal]) == 
    SumBalances(m) - oldVal + newVal
\`\`\`

This lemma explicitly states how \`SumBalances\` changes when you update a single entry. You'll also need a similar lemma for inserting new keys.`,
        suggestions: [
          "Generate the insert lemma too",
          "How do I apply this lemma?",
          "Run verification again",
        ],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    }, 1500);
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
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground">
          <span>claude-4-opus</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Context Badge */}
      <div className="border-b border-border bg-secondary/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Context:</span>
          <span className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-destructive">
            Transfer: postcondition ValidState @ Spec.dfy:28
          </span>
        </div>
      </div>

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
            placeholder="Ask about the verification failure..."
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
          const code = part.replace(/```\w*\n?/g, "").replace(/```$/g, "");
          return (
            <div key={i} className="my-2 rounded border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
                <Code2 className="h-3 w-3" />
                <span>dafny</span>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-foreground">{code}</pre>
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
