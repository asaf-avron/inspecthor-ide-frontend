import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Proxy endpoint for /api/auth/refresh
 * Forwards cookies from frontend domain to backend and updates them
 */
export async function POST(request: NextRequest) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
        });

        if (response.ok) {
            const data = await response.json();
            
            // Get updated cookies from backend response
            const setCookieHeaders = response.headers.getSetCookie();
            const nextResponse = NextResponse.json(data);
            
            // Update cookies on frontend domain
            for (const cookie of setCookieHeaders) {
                const cookieParts = cookie.split(';').map(p => p.trim());
                const [nameValue] = cookieParts;
                const [name, ...valueParts] = nameValue.split('=');
                const value = valueParts.join('=');
                
                const attributes: Record<string, string> = {};
                for (const part of cookieParts.slice(1)) {
                    const [key, val] = part.split('=').map(p => p.trim());
                    attributes[key.toLowerCase()] = val || 'true';
                }
                
                if (name === 'access_token' || name === 'refresh_token') {
                    nextResponse.cookies.set(name, value, {
                        httpOnly: attributes['httponly'] === 'true',
                        secure: attributes['secure'] === 'true',
                        sameSite: (attributes['samesite'] as 'strict' | 'lax' | 'none') || 'lax',
                        maxAge: attributes['max-age'] ? parseInt(attributes['max-age']) : undefined,
                        path: attributes['path'] || '/',
                    });
                }
            }
            
            return nextResponse;
        } else {
            const error = await response.json().catch(() => ({ detail: 'Refresh failed' }));
            return NextResponse.json(error, { status: response.status });
        }
    } catch (error) {
        console.error('Refresh proxy error:', error);
        return NextResponse.json(
            { detail: 'Failed to refresh token' },
            { status: 500 }
        );
    }
}
