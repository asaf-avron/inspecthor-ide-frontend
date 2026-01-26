"use client";

import React from "react"
import { Analytics } from '@vercel/analytics/next'
import { ProjectProvider } from '@/lib/project-context'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>Guardian Gateway - Formal Verification IDE</title>
        <meta name="description" content="A modern IDE for formal verification and proof engineering" />
        <meta name="generator" content="v0.app" />
        <link rel="icon" href="/icon-light-32x32.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/icon-dark-32x32.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`font-sans antialiased dark`}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
        <Analytics />
      </body>
    </html>
  )
}
