"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, Maximize2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface Mermaid ViewerProps {
    diagramCode: string;
    title?: string;
    onError?: (error: string) => void;
}

// Initialize Mermaid
if (typeof window !== 'undefined') {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
}

export function MermaidViewer({ diagramCode, title, onError }: MermaidViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [rendering, setRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string>('');

    useEffect(() => {
        renderDiagram();
    }, [diagramCode]);

    const renderDiagram = async () => {
        if (!containerRef.current || !diagramCode) return;

        setRendering(true);
        setError(null);

        try {
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { svg } = await mermaid.render(id, diagramCode);

            setSvgContent(svg);

            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setRendering(false);
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleReset = () => {
        setZoom(1);
    };

    const handleFullscreen = () => {
        if (containerRef.current?.parentElement) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.parentElement.requestFullscreen();
            }
        }
    };

    const handleExport = () => {
        if (!svgContent) return;

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'diagram'}-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (error) {
        return (
            <Card className="p-6 border-destructive">
                <div className="text-destructive">
                    <p className="font-semibold">Failed to render diagram</p>
                    <p className="text-sm mt-2">{error}</p>
                    <Button
                        onClick={renderDiagram}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Controls */}
            <div className="flex items-center justify-between p-2 border-b">
                <div className="text-sm font-medium">{title}</div>
                <div className="flex items-center space-x-1">
                    <Button
                        onClick={handleZoomOut}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleReset}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                    >
                        {Math.round(zoom * 100)}%
                    </Button>
                    <Button
                        onClick={handleZoomIn}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={zoom >= 3}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        onClick={handleExport}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={!svgContent}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Diagram */}
            <div className="flex-1 overflow-auto p-4 bg-muted/20">
                {rendering ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="flex items-center justify-center min-h-full transition-transform"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center top',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
