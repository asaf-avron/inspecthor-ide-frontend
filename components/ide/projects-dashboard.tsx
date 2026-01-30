"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { ProjectResponse } from "@/lib/types";
import { Plus, Folder, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { useProject } from "@/lib/project-context";
import { useAuth } from "@/lib/auth-context";

export function ProjectsDashboard() {
  const router = useRouter();
  const { createProject } = useProject();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const lastAuthStateRef = useRef<boolean | null>(null);
  const isLoadingRef = useRef(false);

  const loadProjects = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const response = await apiClient.listProjects({ limit: 100, sort: 'updated_at', order: 'desc' });
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
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
        loadProjects();
      }
    }
  }, [isAuthenticated, authLoading, loadProjects]);

  const handleCreateProject = async (name: string, description?: string) => {
    await createProject(name, description);
    await loadProjects();
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/app/${projectId}`);
  };

  const handleTemplateClick = (name: string, description: string) => {
    setShowCreateModal(true);
    // Pre-fill is handled by modal reset; we could pass initial values via a ref or context.
    // For v1 we just open the modal; user can type. Optional: add initialName/initialDescription to CreateProjectModal later.
    void createProject(name, description).then(() => loadProjects());
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
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={handleCreateModalOpenChange}
        onCreateProject={handleCreateProject}
        initialName={templatePrefill?.name}
        initialDescription={templatePrefill?.description}
      />
      <div className="flex flex-1 flex-col overflow-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Architect&apos;s Canvas</h1>
            <p className="text-muted-foreground mt-2">Manage workspaces and agent blueprints</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-1 flex-col gap-6">
            {/* Architect's Canvas: split-view empty state */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 border border-border border-dashed rounded-lg bg-secondary/10 lg:grid-cols-2">
              {/* Left: The Blueprint — Quick Start */}
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-6">
                <div className="flex items-center gap-2">
                  <FileStack className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">The Blueprint</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Import or define Python AI agent specs for the Spec Auditor.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Workspace
                  </Button>
                  <Button variant="outline" size="sm" className="cursor-not-allowed opacity-60" disabled title="Coming soon">
                    Import spec
                  </Button>
                </div>
              </div>
              {/* Right: The Trust Registry — placeholder */}
              <div className="flex flex-col gap-4 rounded-lg border border-border border-dashed bg-background/50 p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Trust Registry</h3>
                </div>
                <p className="text-sm text-muted-foreground/80">
                  Verification results and immutable ledger will appear here.
                </p>
              </div>
            </div>
            {/* Safety Templates gallery */}
            <div className="rounded-lg border border-border bg-secondary/10 p-4">
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">Safety Templates</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card
                  className="cursor-pointer border-border transition-shadow hover:shadow-md hover:border-primary/50"
                  onClick={() => handleTemplateClick("Banking Agent Blueprint", "Compliance and transaction safety")}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Landmark className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Banking</p>
                      <p className="text-xs text-muted-foreground">Compliance and transaction safety</p>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer border-border transition-shadow hover:shadow-md hover:border-primary/50"
                  onClick={() => handleTemplateClick("Healthcare Agent Blueprint", "HIPAA and clinical safety")}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Healthcare</p>
                      <p className="text-xs text-muted-foreground">HIPAA and clinical safety</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.project_id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleProjectClick(project.project_id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <Folder className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{project.file_count} files</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(project.updated_at)}</span>
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
