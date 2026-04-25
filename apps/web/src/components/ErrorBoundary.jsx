
import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-background text-foreground w-full">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-destructive/20">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-4xl font-display font-black mb-4 tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component. Please try refreshing the page.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.reload()} size="lg" className="shadow-lg shadow-primary/20 font-bold px-8">
              <RefreshCw className="w-5 h-5 mr-2" /> Reload Page
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/'} className="font-bold px-8">
              <Home className="w-5 h-5 mr-2" /> Go to Home
            </Button>
          </div>
          {import.meta.env.DEV && this.state.errorInfo && (
            <div className="mt-12 text-left bg-muted/50 p-6 rounded-xl border border-border/50 w-full max-w-4xl overflow-auto">
              <p className="font-bold text-destructive mb-2">Developer Details:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
