import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Proxy endpoint for /api/auth/me
 * Forwards cookies from frontend domain to backend
 */
export async function GET(request: NextRequest) {
    try {
        // Forward request to backend with cookies
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
        });

        if (response.ok) {
            const user = await response.json();
            return NextResponse.json(user);
        } else {
            // Forward error response
            const error = await response.json().catch(() => ({ detail: 'Authentication required' }));
            return NextResponse.json(error, { status: response.status });
        }
    } catch (error) {
        console.error('Auth me proxy error:', error);
        return NextResponse.json(
            { detail: 'Failed to check authentication' },
            { status: 500 }
        );
    }
}
