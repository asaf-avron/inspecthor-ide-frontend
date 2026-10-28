"use client";

import { useState } from "react";
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

interface CreateBlueprintModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateBlueprint: (name: string, description?: string) => Promise<void>;
}

export function CreateBlueprintModal({
    open,
    onOpenChange,
    onCreateBlueprint
}: CreateBlueprintModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Blueprint name is required");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            await onCreateBlueprint(name.trim(), description.trim() || undefined);
            // Reset form
            setName("");
            setDescription("");
            onOpenChange(false);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to create blueprint");
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
                        <DialogTitle>Create New Blueprint</DialogTitle>
                        <DialogDescription>
                            Start a new formal verification blueprint with a blank canvas
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="blueprint-name">
                                Blueprint Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="blueprint-name"
                                placeholder="My Verification Blueprint"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isCreating}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="blueprint-description">
                                Description (Optional)
                            </Label>
                            <Input
                                id="blueprint-description"
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
                                "Create Blueprint"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
