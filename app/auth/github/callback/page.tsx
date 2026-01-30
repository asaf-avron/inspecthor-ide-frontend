"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Completing authentication...');

    useEffect(() => {
        const auth = searchParams.get('auth');
        const error = searchParams.get('error');

        if (error || auth === 'error') {
            setStatus('error');
            setMessage(error || 'Authentication failed');
            
            // Notify parent window of error
            if (window.opener) {
                window.opener.postMessage({ type: 'AUTH_ERROR', error: error || 'Authentication failed' }, window.location.origin);
            }
            
            // Close popup after showing error
            setTimeout(() => {
                window.close();
            }, 3000);
        } else if (auth === 'success') {
            setStatus('success');
            setMessage('Successfully authenticated! Closing...');
            
            // Notify parent window of success - delay slightly to ensure cookies are set
            if (window.opener) {
                // Wait a bit for cookies to be set by backend redirect
                setTimeout(() => {
                    try {
                        console.log('Sending AUTH_SUCCESS message to parent window');
                        window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
                    } catch (e) {
                        console.error('Failed to send message to parent:', e);
                    }
                }, 300);
            }
            
            // Try to close popup - attempt multiple times as browsers may block first attempt
            const attemptClose = () => {
                try {
                    window.close();
                    // If still open after 100ms, try again
                    setTimeout(() => {
                        if (!window.closed) {
                            window.close();
                        }
                    }, 100);
                } catch (e) {
                    console.error('Failed to close window:', e);
                }
            };
            
            // Close after brief delay to show success message
            setTimeout(attemptClose, 1000);
        } else {
            // Still loading or unexpected state
            setTimeout(() => {
                setStatus('error');
                setMessage('Unexpected authentication state');
                if (window.opener) {
                    window.opener.postMessage({ type: 'AUTH_ERROR', error: 'Unexpected state' }, window.location.origin);
                }
                setTimeout(() => window.close(), 2000);
            }, 5000);
        }
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-700">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="mb-4">
                            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-green-600 font-semibold text-lg">{message}</p>
                        <p className="text-gray-600 text-sm mt-2">This window will close automatically</p>
                        {window.opener && (
                            <button
                                onClick={() => window.close()}
                                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Or click here to close
                            </button>
                        )}
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="mb-4">
                            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-semibold text-lg">{message}</p>
                        <p className="text-gray-600 text-sm mt-2">This window will close automatically</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function GitHubCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700">Loading...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
