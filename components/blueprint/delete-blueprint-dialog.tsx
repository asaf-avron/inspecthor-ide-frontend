"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlueprintResponse } from "@/lib/types";

interface DeleteBlueprintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blueprint: BlueprintResponse | null;
    onDeleteBlueprint: (blueprintId: string) => Promise<void>;
}

export function DeleteBlueprintDialog({
    open,
    onOpenChange,
    blueprint,
    onDeleteBlueprint
}: DeleteBlueprintDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!blueprint) return;

        setIsDeleting(true);
        try {
            await onDeleteBlueprint(blueprint.blueprint_id);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete blueprint:", error);
            // Ideally show a toast error here
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        blueprint <span className="font-semibold text-foreground">"{blueprint?.name}"</span> and
                        remove all associated files and verification results.
                        {blueprint?.repository_url && (
                            <p className="mt-2 text-yellow-600 dark:text-yellow-500">
                                Note: This will NOT delete the GitHub repository.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Blueprint"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
