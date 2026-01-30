"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateProject: (name: string, description?: string) => Promise<void>;
    initialName?: string;
    initialDescription?: string;
}

export function CreateProjectModal({ 
    open, 
    onOpenChange, 
    onCreateProject,
    initialName,
    initialDescription,
}: CreateProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && initialName !== undefined) {
            setName(initialName);
            setDescription(initialDescription ?? "");
        }
        if (!open) {
            setName("");
            setDescription("");
        }
    }, [open, initialName, initialDescription]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError("Workspace name is required");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            await onCreateProject(name.trim(), description.trim() || undefined);
            // Reset form
            setName("");
            setDescription("");
            onOpenChange(false);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to create workspace");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setName("");
            setDescription("");
            setError(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>New Workspace</DialogTitle>
                        <DialogDescription>
                            Start a new workspace for formal verification
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">
                                Project Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="project-name"
                                placeholder="My Verification Project"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isCreating}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-description">
                                Description (Optional)
                            </Label>
                            <Input
                                id="project-description"
                                placeholder="Brief description of what you're verifying"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isCreating}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !name.trim()}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Workspace"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
