import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Proxy endpoint for GitHub OAuth callback
 * This allows cookies to be set on the frontend domain (localhost:3000)
 * instead of the backend domain (localhost:8000)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');

    // Forward the callback to backend
    const backendUrl = new URL(`${API_BASE_URL}/api/auth/github/callback`);
    if (code) backendUrl.searchParams.set('code', code);
    if (error) backendUrl.searchParams.set('error', error);
    if (errorDescription) backendUrl.searchParams.set('error_description', errorDescription);
    if (state) backendUrl.searchParams.set('state', state);

    try {
        const response = await fetch(backendUrl.toString(), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
                'X-Proxy-Request': 'true',  // Signal to backend that this is a proxy request
                'Referer': request.url,      // Pass referer so backend knows it's from proxy
            },
        });

        // Create redirect URL
        const redirectUrl = new URL('/auth/github/callback', request.url);

        if (error) {
            redirectUrl.searchParams.set('auth', 'error');
            redirectUrl.searchParams.set('error', error);
            return NextResponse.redirect(redirectUrl);
        }

        if (response.ok) {
            // Backend returned JSON with tokens
            const data = await response.json();
            
            if (data.status === 'success' && data.access_token && data.refresh_token) {
                // Set redirect URL params first
                redirectUrl.searchParams.set('auth', 'success');
                
                // Create redirect response
                const nextResponse = NextResponse.redirect(redirectUrl);
                
                // Set cookies on frontend domain
                const accessTokenMaxAge = 15 * 60; // 15 minutes
                const refreshTokenMaxAge = 7 * 24 * 60 * 60; // 7 days
                
                nextResponse.cookies.set('access_token', data.access_token, {
                    httpOnly: true,
                    secure: false, // HTTP in development
                    sameSite: 'lax',
                    maxAge: accessTokenMaxAge,
                    path: '/',
                });
                
                nextResponse.cookies.set('refresh_token', data.refresh_token, {
                    httpOnly: true,
                    secure: false, // HTTP in development
                    sameSite: 'lax',
                    maxAge: refreshTokenMaxAge,
                    path: '/',
                });
                
                return nextResponse;
            } else {
                redirectUrl.searchParams.set('auth', 'error');
                redirectUrl.searchParams.set('error', 'no_tokens');
                return NextResponse.redirect(redirectUrl);
            }
        } else {
            redirectUrl.searchParams.set('auth', 'error');
            redirectUrl.searchParams.set('error', 'callback_failed');
            return NextResponse.redirect(redirectUrl);
        }
    } catch (error) {
        console.error('Callback proxy error:', error);
        const redirectUrl = new URL('/auth/github/callback', request.url);
        redirectUrl.searchParams.set('auth', 'error');
        redirectUrl.searchParams.set('error', 'proxy_error');
        return NextResponse.redirect(redirectUrl);
    }
}
