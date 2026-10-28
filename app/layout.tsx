"use client";

import React from "react"
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { GitHubProvider } from '@/lib/github-context'
import { BlueprintProvider } from '@/lib/blueprint-context'
import { FileProvider } from '@/lib/contexts/file-context'
import { VerificationProvider } from '@/lib/contexts/verification-context'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Inspecthor - Formal Verification IDE</title>
        <meta name="description" content="A modern IDE for formal verification and proof engineering" />
        <meta name="generator" content="v0.app" />
        <link rel="icon" href="/icon-light-32x32.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/icon-dark-32x32.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <GitHubProvider>
              <BlueprintProvider>
                <FileProvider>
                  <VerificationProvider>
                    {children}
                  </VerificationProvider>
                </FileProvider>
              </BlueprintProvider>
            </GitHubProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}

