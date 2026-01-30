"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Github, Loader2, Lock, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: 'verify' | 'save' | 'export' | 'general';
}

export function LoginModal({ open, onOpenChange, trigger = 'general' }: LoginModalProps) {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        login();
        // Close modal after a delay to allow popup to open
        setTimeout(() => {
            onOpenChange(false);
            setIsLoading(false);
        }, 500);
    };

    const getTriggerMessage = () => {
        switch (trigger) {
            case 'verify':
                return 'Sign in to run Dafny verification';
            case 'save':
                return 'Sign in to save workspaces to the cloud';
            case 'export':
                return 'Sign in to export workspaces to GitHub';
            default:
                return 'Sign in to unlock all features';
        }
    };

    const getTriggerIcon = () => {
        switch (trigger) {
            case 'verify':
                return <Lock className="h-12 w-12 text-primary" />;
            case 'save':
            case 'export':
                return <Github className="h-12 w-12 text-primary" />;
            default:
                return <Zap className="h-12 w-12 text-primary" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {getTriggerIcon()}
                    </div>
                    <DialogTitle className="text-center text-xl">
                        {getTriggerMessage()}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Continue with GitHub to access premium features and save your work
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Feature List */}
                    <div className="space-y-2 rounded-lg bg-secondary/50 p-4">
                        <h4 className="text-sm font-medium">Free Tier Includes:</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                10 Dafny verifications per day
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                20 AI analyses per day
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                5 cloud workspaces
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                GitHub export
                            </li>
                        </ul>
                    </div>

                    {/* Sign In Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opening GitHub...
                            </>
                        ) : (
                            <>
                                <Github className="mr-2 h-5 w-5" />
                                Continue with GitHub
                            </>
                        )}
                    </Button>

                    {/* Continue without auth */}
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                    >
                        Continue without signing in
                    </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Local editing is always free and unlimited
                </p>
            </DialogContent>
        </Dialog>
    );
}
