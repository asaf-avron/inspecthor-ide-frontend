"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If opened in popup with auth=success, redirect to callback page
    const auth = searchParams.get('auth');
    if (auth === 'success' && window.opener) {
      router.replace('/auth/github/callback?auth=success');
      return;
    }
    
    // Redirect to unified IDE
    router.replace('/app');
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

