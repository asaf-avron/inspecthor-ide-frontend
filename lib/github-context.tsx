/**
 * GitHub connection context for InspecThor.
 * Manages GitHub App installations, repositories, and connection state.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Installation {
  installation_id: number;
  account_login: string;
  account_type: 'User' | 'Organization';
  is_active: boolean;
  installed_at: string;
}

export interface Repository {
  repository_id: string;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  default_branch: string;
  project_id?: string;
  last_synced_at?: string;
}

interface GitHubContextType {
  installations: Installation[];
  repositories: Repository[];
  selectedRepo: Repository | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInstallations: () => Promise<void>;
  fetchRepositories: (installationId: number) => Promise<void>;
  selectRepository: (repo: Repository) => void;
  importRepository: (repo: Repository, projectName: string) => Promise<void>;
  createPullRequest: (repoId: string, files: any[], title: string, body: string) => Promise<string>;
  refreshConnection: () => Promise<void>;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export function GitHubProvider({ children }: { children: ReactNode }) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = installations.length > 0;

  const fetchInstallations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/installations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch installations');
      }

      const data = await response.json();
      setInstallations(data.installations || []);
    } catch (err: any) {
      setError(err.message);
      console.error('[GitHub] Failed to fetch installations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRepositories = useCallback(async (installationId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/installations/${installationId}/repositories`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (err: any) {
      setError(err.message);
      console.error('[GitHub] Failed to fetch repositories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRepository = useCallback((repo: Repository) => {
    setSelectedRepo(repo);
  }, []);

  const importRepository = useCallback(async (repo: Repository, projectName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/repositories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repository_id: repo.repository_id,
          project_name: projectName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import repository');
      }

      const data = await response.json();
      console.log('[GitHub] Repository imported:', data);
      
      // Refresh repositories to get updated project link
      if (selectedRepo) {
        await fetchRepositories(installations[0].installation_id);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('[GitHub] Failed to import repository:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [installations, selectedRepo, fetchRepositories]);

  const createPullRequest = useCallback(async (
    repoId: string,
    files: any[],
    title: string,
    body: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/pull-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repository_id: repoId,
          files,
          title,
          body,
          draft: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create pull request');
      }

      const data = await response.json();
      console.log('[GitHub] Pull request created:', data);
      
      return data.url;
    } catch (err: any) {
      setError(err.message);
      console.error('[GitHub] Failed to create PR:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshConnection = useCallback(async () => {
    await fetchInstallations();
    if (installations.length > 0) {
      await fetchRepositories(installations[0].installation_id);
    }
  }, [fetchInstallations, fetchRepositories, installations]);

  const value: GitHubContextType = {
    installations,
    repositories,
    selectedRepo,
    isConnected,
    isLoading,
    error,
    fetchInstallations,
    fetchRepositories,
    selectRepository,
    importRepository,
    createPullRequest,
    refreshConnection
  };

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub() {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error('useGitHub must be used within GitHubProvider');
  }
  return context;
}
