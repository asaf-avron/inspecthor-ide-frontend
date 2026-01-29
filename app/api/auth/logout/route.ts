import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Proxy endpoint for /api/auth/logout
 * Forwards cookies from frontend domain to backend
 */
export async function POST(request: NextRequest) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
        });

        const result = await response.json().catch(() => ({ status: 'success' }));
        
        const nextResponse = NextResponse.json(result);
        
        // Clear cookies on frontend domain as well
        nextResponse.cookies.delete('access_token');
        nextResponse.cookies.delete('refresh_token');
        
        return nextResponse;
    } catch (error) {
        console.error('Logout proxy error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Logout failed' },
            { status: 500 }
        );
    }
}
