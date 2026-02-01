"use client";

import { useState } from "react";
import { Rocket, Github, Loader2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { initializeBlueprint } from "@/lib/api-client";
import type { BlueprintDomain, BlueprintInitResponse } from "@/lib/types";

interface BlueprintInitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    installationId?: number;
    onSuccess?: (response: BlueprintInitResponse) => void;
}

type ModalState = "form" | "loading" | "success" | "error";

export function BlueprintInitModal({
    open,
    onOpenChange,
    installationId,
    onSuccess,
}: BlueprintInitModalProps) {
    const [state, setState] = useState<ModalState>("form");
    const [name, setName] = useState("");
    const [repositoryUrl, setRepositoryUrl] = useState("");
    const [domain, setDomain] = useState<BlueprintDomain>("custom");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BlueprintInitResponse | null>(null);

    const handleSubmit = async () => {
        if (!name.trim() || !repositoryUrl.trim()) {
            setError("Please fill in all required fields");
            return;
        }

        // Validate GitHub URL format
        const githubUrlPattern = /^https?:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?$/;
        if (!githubUrlPattern.test(repositoryUrl.trim())) {
            setError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
            return;
        }

        setState("loading");
        setError(null);

        try {
            const response = await initializeBlueprint({
                name: name.trim(),
                repository_url: repositoryUrl.trim(),
                installation_id: installationId || 0,
                domain,
                force: false,
            });

            setResult(response);
            setState("success");
            onSuccess?.(response);
        } catch (err) {
            setState("error");
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to initialize blueprint. Please try again.");
            }
        }
    };

    const handleClose = () => {
        // Reset state when closing
        setState("form");
        setName("");
        setRepositoryUrl("");
        setDomain("custom");
        setError(null);
        setResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Initialize Blueprint
                    </DialogTitle>
                    <DialogDescription>
                        Set up a new verified project structure in your GitHub repository.
                        This will push the Trusted Kernel Architecture template.
                    </DialogDescription>
                </DialogHeader>

                {state === "form" && (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Blueprint Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Payment System"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="repository">GitHub Repository URL</Label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="repository"
                                        placeholder="https://github.com/owner/repo"
                                        className="pl-10"
                                        value={repositoryUrl}
                                        onChange={(e) => setRepositoryUrl(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    The repository should be empty or contain only README/LICENSE.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="domain">Domain Preset</Label>
                                <Select value={domain} onValueChange={(v: string) => setDomain(v as BlueprintDomain)}>
                                    <SelectTrigger id="domain">
                                        <SelectValue placeholder="Select domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Custom (blank template)</SelectItem>
                                        <SelectItem value="banking">Banking (financial transactions)</SelectItem>
                                        <SelectItem value="healthcare">Healthcare (patient data)</SelectItem>
                                        <SelectItem value="authentication">Authentication (user sessions)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} className="gap-2">
                                <Rocket className="h-4 w-4" />
                                Initialize
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {state === "loading" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="font-medium">Initializing Blueprint...</p>
                            <p className="text-sm text-muted-foreground">
                                Pushing template files to GitHub
                            </p>
                        </div>
                    </div>
                )}

                {state === "success" && result && (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-700 dark:text-green-300">
                                Blueprint initialized successfully!
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Commit</p>
                                <code className="text-sm">{result.commit_sha.slice(0, 7)}</code>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Files Created</p>
                                <ul className="mt-1 space-y-0.5 text-sm">
                                    {result.files_created.map((file) => (
                                        <li key={file} className="font-mono text-xs text-muted-foreground">
                                            {file}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Next Steps</p>
                                <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">
                                    {result.next_steps.slice(1).map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        <DialogFooter className="mt-2">
                            <Button
                                variant="outline"
                                onClick={() => window.open(result.commit_url, "_blank")}
                                className="gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View on GitHub
                            </Button>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                )}

                {state === "error" && (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="rounded-md bg-destructive/10 p-4 text-center">
                            <p className="font-medium text-destructive">Initialization Failed</p>
                            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={() => setState("form")}>Try Again</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
