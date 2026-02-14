import React, { Component, ErrorInfo, ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full glass p-8 rounded-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold font-ndot mb-2">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm">
                                We encountered an unexpected error.
                            </p>
                            {this.state.error && (
                                <pre className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs text-left overflow-auto max-h-32 text-muted-foreground font-mono">
                                    {this.state.error.message}
                                </pre>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
