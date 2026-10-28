"use client";

import { useEffect, useState } from "react";
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
import type { BlueprintResponse } from "@/lib/types";

interface EditBlueprintModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blueprint: BlueprintResponse | null;
    onUpdateBlueprint: (blueprintId: string, name: string, description?: string) => Promise<void>;
}

export function EditBlueprintModal({
    open,
    onOpenChange,
    blueprint,
    onUpdateBlueprint
}: EditBlueprintModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form when blueprint updates or modal opens
    useEffect(() => {
        if (blueprint && open) {
            setName(blueprint.name);
            setDescription(blueprint.description || "");
            setError(null);
        }
    }, [blueprint, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!blueprint) return;

        if (!name.trim()) {
            setError("Blueprint name is required");
            return;
        }

        setIsUpdating(true);
        setError(null);

        try {
            await onUpdateBlueprint(blueprint.blueprint_id, name.trim(), description.trim() || undefined);
            onOpenChange(false);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to update blueprint");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleClose = () => {
        if (!isUpdating) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Blueprint</DialogTitle>
                        <DialogDescription>
                            Update the name and description of your blueprint
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-blueprint-name">
                                Blueprint Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-blueprint-name"
                                placeholder="My Verification Blueprint"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isUpdating}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-blueprint-description">
                                Description (Optional)
                            </Label>
                            <Input
                                id="edit-blueprint-description"
                                placeholder="Brief description of what you're verifying"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isUpdating}
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
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isUpdating || !name.trim()}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
