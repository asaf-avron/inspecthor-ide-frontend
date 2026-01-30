/**
 * Repository Picker Component for InspecThor.
 * Allows users to import GitHub repositories into the IDE.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useGitHub } from '@/lib/github-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function RepoPicker() {
  const {
    installations,
    repositories,
    isLoading,
    error,
    fetchInstallations,
    fetchRepositories,
    importRepository
  } = useGitHub();

  const [selectedInstallation, setSelectedInstallation] = useState<number | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [projectName, setProjectName] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  useEffect(() => {
    if (installations.length > 0 && !selectedInstallation) {
      const firstInstallation = installations[0];
      setSelectedInstallation(firstInstallation.installation_id);
      fetchRepositories(firstInstallation.installation_id);
    }
  }, [installations, selectedInstallation, fetchRepositories]);

  const handleImport = async () => {
    if (!selectedRepo || !projectName) return;

    setImporting(true);
    try {
      await importRepository(selectedRepo, projectName);
      alert(`Repository imported successfully as "${projectName}"`);
      setSelectedRepo(null);
      setProjectName('');
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  if (isLoading && installations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading installations...</p>
      </div>
    );
  }

  if (installations.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Connect GitHub</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Install the InspecThor GitHub App to import repositories.
        </p>
        <Button asChild>
          <a href="/api/github/install" target="_blank">
            Install GitHub App
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Installation Selector */}
      {installations.length > 1 && (
        <div>
          <label className="text-sm font-medium">Installation</label>
          <select
            className="w-full mt-1 p-2 border rounded"
            value={selectedInstallation || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setSelectedInstallation(id);
              fetchRepositories(id);
            }}
          >
            {installations.map((inst) => (
              <option key={inst.installation_id} value={inst.installation_id}>
                {inst.account_login} ({inst.account_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Repository List */}
      <div>
        <label className="text-sm font-medium">Select Repository</label>
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {repositories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repositories found.</p>
          ) : (
            repositories.map((repo) => (
              <Card
                key={repo.repository_id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedRepo?.repository_id === repo.repository_id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setSelectedRepo(repo);
                  setProjectName(repo.name);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{repo.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Default: {repo.default_branch}
                      {repo.project_id && ' • Already imported'}
                    </p>
                  </div>
                  {repo.project_id && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Imported
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Import Form */}
      {selectedRepo && !selectedRepo.project_id && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Import as Workspace</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Workspace name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter workspace name"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={!projectName || importing}
              className="w-full"
            >
              {importing ? 'Importing...' : 'Import Repository'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}
    </div>
  );
}
