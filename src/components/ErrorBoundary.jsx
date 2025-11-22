import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches errors in child components and displays a recovery UI
 * Prevents entire app from crashing due to errors in individual components
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // In production, you would log to error tracking service (e.g., Sentry)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full">
                        <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={32} className="text-red-400" />
                            </div>

                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    Oops, Something Went Wrong
                                </h1>
                                <p className="text-red-200/80 text-sm mb-4">
                                    An unexpected error occurred. The app has been automatically recovered.
                                </p>
                                {import.meta.env.DEV && this.state.error && (
                                    <details className="mt-4 text-left">
                                        <summary className="cursor-pointer text-xs text-red-300/70 hover:text-red-300">
                                            Error Details (Development Only)
                                        </summary>
                                        <pre className="mt-2 text-xs bg-red-950/50 p-3 rounded border border-red-500/30 text-red-300 overflow-auto max-h-40">
                                            {this.state.error.toString()}
                                        </pre>
                                    </details>
                                )}
                            </div>

                            <button
                                onClick={this.handleReset}
                                className="w-full bg-white text-red-900 font-bold py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18} />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
