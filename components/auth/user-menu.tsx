"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    User, 
    Settings, 
    LogOut, 
    CreditCard, 
    Github,
    Zap,
    Loader2,
    Sun,
    Moon,
    Monitor
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";

export function UserMenu() {
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { setTheme, theme } = useTheme();

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case 'pro':
                return <span className="text-xs font-semibold text-primary">PRO</span>;
            case 'team':
                return <span className="text-xs font-semibold text-accent-violet">TEAM</span>;
            default:
                return <span className="text-xs text-muted-foreground">Free</span>;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage 
                            src={user.avatar_url || undefined} 
                            alt={user.github_login} 
                        />
                        <AvatarFallback>
                            {getInitials(user.github_login)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.github_login}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email || 'No email'}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                            {getTierBadge(user.tier)}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Zap className="h-3 w-3" />
                                {user.verification_credits} credits
                            </div>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/app')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://github.com/${user.github_login}`, '_blank')}>
                    <Github className="mr-2 h-4 w-4" />
                    <span>GitHub Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                    <DropdownMenuLabel className="text-xs text-muted-foreground mb-1.5 px-0">Theme</DropdownMenuLabel>
                    <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-md">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                                theme === 'light'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Sun className="h-3 w-3" />
                            <span>Light</span>
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                                theme === 'dark'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Moon className="h-3 w-3" />
                            <span>Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                                theme === 'system' || !theme
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Monitor className="h-3 w-3" />
                            <span>System</span>
                        </button>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-destructive focus:text-destructive"
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Signing out...</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
