"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { BlueprintResponse } from "@/lib/types";
import { Plus, Folder, Calendar, FileText, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBlueprintModal } from "@/components/blueprint/create-blueprint-modal";
import { EditBlueprintModal } from "@/components/blueprint/edit-blueprint-modal";
import { DeleteBlueprintDialog } from "@/components/blueprint/delete-blueprint-dialog";
import { useBlueprint } from "@/lib/blueprint-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

export function BlueprintsDashboard() {
  const router = useRouter();
  const { createBlueprint } = useBlueprint();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [blueprints, setBlueprints] = useState<BlueprintResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blueprintToEdit, setBlueprintToEdit] = useState<BlueprintResponse | null>(null);
  const [blueprintToDelete, setBlueprintToDelete] = useState<BlueprintResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Refs
  const lastAuthStateRef = useRef<boolean | null>(null);
  const isLoadingRef = useRef(false);

  const handleUpdateBlueprint = async (blueprintId: string, name: string, description?: string) => {
    try {
      await apiClient.updateBlueprint(blueprintId, { name, description });
      await loadBlueprints();
    } catch (error) {
      console.error('Failed to update blueprint:', error);
      throw error; // Re-throw to be handled by modal
    }
  };

  const handleDeleteBlueprint = async (blueprintId: string) => {
    try {
      await apiClient.deleteBlueprint(blueprintId);
      await loadBlueprints();
    } catch (error) {
      console.error('Failed to delete blueprint:', error);
      throw error;
    }
  };

  const loadBlueprints = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      // Don't set full page loading for refreshes
      isLoadingRef.current = true;
      const response = await apiClient.listBlueprints({ limit: 100, sort: 'updated_at', order: 'desc' });
      setBlueprints(response.blueprints);
    } catch (error) {
      console.error('Failed to load blueprints:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only reload when auth loading completes and auth state actually changes
    if (!authLoading) {
      const authChanged = lastAuthStateRef.current !== isAuthenticated;
      lastAuthStateRef.current = isAuthenticated;

      if (authChanged || lastAuthStateRef.current === null) {
        setIsLoading(true); // Initial load
        loadBlueprints();
      }
    }
  }, [isAuthenticated, authLoading, loadBlueprints]);

  const handleCreateBlueprint = async (name: string, description?: string) => {
    await createBlueprint(name, description);
    await loadBlueprints();
  };

  const handleBlueprintClick = (blueprintId: string) => {
    router.push(`/app/${blueprintId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading blueprints...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateBlueprintModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateBlueprint={handleCreateBlueprint}
      />

      <EditBlueprintModal
        open={!!blueprintToEdit}
        onOpenChange={(open) => !open && setBlueprintToEdit(null)}
        blueprint={blueprintToEdit}
        onUpdateBlueprint={handleUpdateBlueprint}
      />

      <DeleteBlueprintDialog
        open={!!blueprintToDelete}
        onOpenChange={(open) => !open && setBlueprintToDelete(null)}
        blueprint={blueprintToDelete}
        onDeleteBlueprint={handleDeleteBlueprint}
      />

      <div className="flex flex-1 flex-col overflow-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blueprints</h1>
            <p className="text-muted-foreground mt-2">Manage your formal verification blueprints</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Blueprint
          </Button>
        </div>

        {blueprints.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No blueprints yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Create your first blueprint to get started with formal verification
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Blueprint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blueprints.map((blueprint) => (
              <Card
                key={blueprint.blueprint_id}
                className="cursor-pointer transition-shadow hover:shadow-md group relative"
                onClick={() => handleBlueprintClick(blueprint.blueprint_id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 pr-8">{blueprint.name}</CardTitle>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setBlueprintToEdit(blueprint)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setBlueprintToDelete(blueprint)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Folder className="h-4 w-4" />
                    {blueprint.description && (
                      <CardDescription className="line-clamp-1">{blueprint.description}</CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{blueprint.file_count} files</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(blueprint.updated_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
