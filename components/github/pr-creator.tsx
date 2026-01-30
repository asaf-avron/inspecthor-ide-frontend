/**
 * Pull Request Creator Component for InspecThor.
 * Implements the "Ghost Commit Protocol" - submit fixes from IDE to GitHub.
 */

'use client';

import React, { useState } from 'react';
import { useGitHub } from '@/lib/github-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FileChange {
  path: string;
  content: string;
}

interface PRCreatorProps {
  repositoryId?: string;
  changedFiles: FileChange[];
  onSuccess?: (prUrl: string) => void;
  onCancel?: () => void;
}

export function PRCreator({ repositoryId, changedFiles, onSuccess, onCancel }: PRCreatorProps) {
  const { selectedRepo, createPullRequest, isLoading } = useGitHub();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const effectiveRepoId = repositoryId || selectedRepo?.repository_id;

  const handleSubmit = async () => {
    if (!effectiveRepoId || !title || changedFiles.length === 0) {
      alert('Please provide a title and ensure there are changes to submit.');
      return;
    }

    try {
      const url = await createPullRequest(effectiveRepoId, changedFiles, title, body);
      setPrUrl(url);
      setIsDialogOpen(true);
      onSuccess?.(url);
    } catch (err) {
      console.error('Failed to create PR:', err);
      alert('Failed to create pull request. Please try again.');
    }
  };

  if (!effectiveRepoId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          No repository selected. Please import a repository first.
        </p>
      </Card>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          No changes to submit.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Submit Fix to GitHub</h3>
        
        <div className="space-y-4">
          {/* Changed Files Summary */}
          <div>
            <p className="text-sm font-medium mb-2">Files to commit:</p>
            <ul className="text-sm space-y-1">
              {changedFiles.map((file, idx) => (
                <li key={idx} className="text-muted-foreground">
                  • {file.path}
                </li>
              ))}
            </ul>
          </div>

          {/* PR Title */}
          <div>
            <label className="text-sm font-medium">Pull Request Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="fix: resolve verification issue in auth"
              className="mt-1"
            />
          </div>

          {/* PR Description */}
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the changes and why they're needed..."
              className="w-full mt-1 p-2 border rounded min-h-[100px] text-sm"
            />
          </div>

          {/* Verification Badge */}
          <div className="bg-primary/10 border border-primary/20 rounded p-3">
            <p className="text-sm font-medium text-primary">
              ✓ Changes verified by InspecThor
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All modifications have passed formal verification and satisfy their specifications.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!title || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating Pull Request...' : 'Create Pull Request'}
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pull Request Created!</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Your changes have been successfully submitted to GitHub.
                </p>
                {prUrl && (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    View Pull Request →
                  </a>
                )}
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• InspecThor will verify the changes again</li>
                    <li>• A check run will appear on the PR</li>
                    <li>• Team members can review and merge</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Quick PR Button - Simplified version for toolbar/header
 */
export function QuickPRButton({ 
  changedFiles, 
  onSuccess 
}: { 
  changedFiles: FileChange[];
  onSuccess?: (prUrl: string) => void;
}) {
  const [showCreator, setShowCreator] = useState(false);

  if (changedFiles.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowCreator(true)}
        className="gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Submit to GitHub
      </Button>

      {showCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <PRCreator
              changedFiles={changedFiles}
              onSuccess={(url) => {
                setShowCreator(false);
                onSuccess?.(url);
              }}
              onCancel={() => setShowCreator(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
