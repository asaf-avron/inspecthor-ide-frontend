"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// API Configuration - same as api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// === Types ===
export interface User {
    user_id: string;
    github_id: number;
    github_login: string;
    email: string | null;
    avatar_url: string | null;
    tier: 'free' | 'pro' | 'team';
    verification_credits: number;
    created_at: string;
    last_login_at: string | null;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: () => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

// === Context ===
const AuthContext = createContext<AuthContextType | null>(null);

// === Provider ===
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    const checkAuth = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            
            // Use frontend API route proxy to ensure cookies are sent
            const response = await fetch('/api/auth/me', {
                credentials: 'include',
            });

            if (response.ok) {
                const user = await response.json();
                console.log('Auth check successful:', user);
                setState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
            } else {
                const errorText = await response.text();
                console.warn('Auth check failed:', response.status, errorText);
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication check failed',
            });
        }
    }, []);

    const login = useCallback(async () => {
        try {
            // Get GitHub OAuth URL from backend
            const response = await fetch(`${API_BASE_URL}/api/auth/github`, {
                credentials: 'include',
            });
            
            if (!response.ok) {
                const error = await response.json();
                setState(prev => ({
                    ...prev,
                    error: error.detail || 'Failed to initiate GitHub login',
                }));
                return;
            }
            
            const data = await response.json();
            const authUrl = data.authorization_url;
            
            // Open GitHub OAuth in popup
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            const popup = window.open(
                authUrl,
                'github-oauth',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                setState(prev => ({
                    ...prev,
                    error: 'Popup blocked. Please allow popups for this site.',
                }));
                return;
            }

            // Listen for messages from popup
            const handleMessage = (event: MessageEvent) => {
                // Verify origin for security
                if (event.origin !== window.location.origin) {
                    return;
                }

                if (event.data.type === 'AUTH_SUCCESS') {
                    console.log('Received AUTH_SUCCESS message from popup');
                    // Close popup if still open
                    if (popup && !popup.closed) {
                        popup.close();
                    }
                    // Small delay to ensure cookies are set, then refresh auth state
                    setTimeout(() => {
                        console.log('Refreshing auth state after success...');
                        checkAuth();
                    }, 200);
                    // Remove listener
                    window.removeEventListener('message', handleMessage);
                } else if (event.data.type === 'AUTH_ERROR') {
                    // Close popup if still open
                    if (popup && !popup.closed) {
                        popup.close();
                    }
                    // Set error state
                    setState(prev => ({
                        ...prev,
                        error: event.data.error || 'Authentication failed',
                    }));
                    // Remove listener
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

            // Fallback: check if popup closed without message (user closed manually)
            const checkPopup = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkPopup);
                    window.removeEventListener('message', handleMessage);
                    // Still check auth state in case auth succeeded before popup closed
                    setTimeout(() => checkAuth(), 500);
                }
            }, 500);
        } catch (error) {
            console.error('Login failed:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to initiate login',
            }));
        }
    }, [checkAuth]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('Logout failed:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Logout failed',
            }));
        }
    }, []);

    const refreshUser = useCallback(async () => {
        await checkAuth();
    }, [checkAuth]);

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Auto-refresh token before expiry (every 10 minutes)
    useEffect(() => {
        if (!state.isAuthenticated) return;

        const refreshInterval = setInterval(async () => {
            try {
                await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(refreshInterval);
    }, [state.isAuthenticated]);

    const contextValue: AuthContextType = {
        ...state,
        login,
        logout,
        refreshUser,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// === Hook ===
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
