"use client";

import { useState, useEffect } from "react";
import { Rocket, Loader2, Check, ExternalLink, ChevronDown } from "lucide-react";
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

interface Repository {
    github_repo_id: number;
    owner: string;
    name: string;
    full_name: string;
    default_branch: string;
    html_url: string;
    private?: boolean;
    description?: string;
}

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
    const [selectedRepo, setSelectedRepo] = useState<string>("");
    const [domain, setDomain] = useState<BlueprintDomain>("custom");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BlueprintInitResponse | null>(null);

    // Repository loading state
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [reposError, setReposError] = useState<string | null>(null);

    // Fetch repositories when modal opens and installation ID is available
    useEffect(() => {
        if (open && installationId && installationId > 0) {
            fetchRepositories();
        }
    }, [open, installationId]);

    const fetchRepositories = async () => {
        if (!installationId || installationId <= 0) return;

        setLoadingRepos(true);
        setReposError(null);

        try {
            const response = await fetch(`/api/github/installations/${installationId}/repositories`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch repositories: ${response.status}`);
            }

            const data = await response.json();
            setRepositories(data.repositories || []);
        } catch (err) {
            console.error('Failed to fetch repositories:', err);
            setReposError(err instanceof Error ? err.message : 'Failed to load repositories');
        } finally {
            setLoadingRepos(false);
        }
    };

    // Auto-derive name from selected repo
    const handleRepoChange = (repoFullName: string) => {
        setSelectedRepo(repoFullName);

        // Find the repo and derive a friendly name
        const repo = repositories.find(r => r.full_name === repoFullName);
        if (repo) {
            // Convert repo-name to "Repo Name"
            const derivedName = repo.name
                .split(/[-_]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            setName(derivedName);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !selectedRepo) {
            setError("Please select a repository and provide a name");
            return;
        }

        const repo = repositories.find(r => r.full_name === selectedRepo);
        if (!repo) {
            setError("Please select a valid repository");
            return;
        }

        setState("loading");
        setError(null);

        try {
            const response = await initializeBlueprint({
                name: name.trim(),
                repository_url: repo.html_url,
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
        setSelectedRepo("");
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
                                <Label htmlFor="repository">Select Repository</Label>
                                {loadingRepos ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading repositories...
                                    </div>
                                ) : reposError ? (
                                    <div className="text-sm text-destructive py-2">
                                        {reposError}
                                        <Button variant="link" size="sm" onClick={fetchRepositories} className="ml-2">
                                            Retry
                                        </Button>
                                    </div>
                                ) : repositories.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-2">
                                        No repositories found. Make sure the InspecThor app has access to your repositories.
                                    </div>
                                ) : (
                                    <Select value={selectedRepo} onValueChange={handleRepoChange}>
                                        <SelectTrigger id="repository">
                                            <SelectValue placeholder="Choose a repository..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {repositories.map((repo) => (
                                                <SelectItem key={repo.full_name} value={repo.full_name}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{repo.full_name}</span>
                                                        {repo.private && (
                                                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                                private
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    The repository should be empty or contain only README/LICENSE.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Blueprint Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Payment System"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    A friendly name for your blueprint. Auto-derived from repo name.
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
                            <Button
                                onClick={handleSubmit}
                                className="gap-2"
                                disabled={!selectedRepo || !name.trim() || loadingRepos}
                            >
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
